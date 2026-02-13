// backend/src/modules/contacts/contacts.service.js
import prismaService from "../../db/prisma.js";
import eventEmitter from "../../events/eventEmitter.js";

class ContactsService {
  /**
   * Get all contacts for workspace
   */
  async getContacts(workspaceId, filters = {}) {
    const where = { workspaceId };

    // Filter by search term
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const contacts = await prismaService.client.contact.findMany({
      where,
      include: {
        conversations: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        bookings: {
          select: {
            id: true,
            status: true,
            startTime: true,
          },
          orderBy: {
            startTime: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return contacts;
  }

  /**
   * Get contact by ID
   */
  async getContact(contactId, workspaceId) {
    const contact = await prismaService.client.contact.findFirst({
      where: {
        id: contactId,
        workspaceId,
      },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: {
                sentAt: "desc",
              },
              take: 10,
            },
          },
        },
        bookings: {
          include: {
            bookingType: true,
          },
          orderBy: {
            startTime: "desc",
          },
        },
      },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    return contact;
  }

  /**
   * Create contact (authenticated)
   */
  async createContact(workspaceId, data) {
    // Check if contact already exists
    let contact = null;

    if (data.email || data.phone) {
      contact = await prismaService.client.contact.findFirst({
        where: {
          workspaceId,
          OR: [
            data.email ? { email: data.email } : null,
            data.phone ? { phone: data.phone } : null,
          ].filter(Boolean),
        },
      });
    }

    // Create new contact if doesn't exist
    if (!contact) {
      // Split name into firstName and lastName
      const nameParts = data.name.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || null;

      contact = await prismaService.client.contact.create({
        data: {
          workspaceId,
          firstName,
          lastName,
          email: data.email,
          phone: data.phone,
          customFields: {
            address: data.address,
            notes: data.notes,
          },
        },
      });
    }

    return contact;
  }

  /**
   * Create contact from public form
   */
  async createPublicContact(workspaceId, data) {
    // Check if contact already exists
    let contact = null;

    if (data.email || data.phone) {
      contact = await prismaService.client.contact.findFirst({
        where: {
          workspaceId,
          OR: [
            data.email ? { email: data.email } : null,
            data.phone ? { phone: data.phone } : null,
          ].filter(Boolean),
        },
      });
    }

    // Create new contact if doesn't exist
    if (!contact) {
      // Split name into firstName and lastName
      const nameParts = data.name.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || null;

      contact = await prismaService.client.contact.create({
        data: {
          workspaceId,
          firstName,
          lastName,
          email: data.email,
          phone: data.phone,
        },
      });

      // Create conversation
      const conversation = await prismaService.client.conversation.create({
        data: {
          workspaceId,
          contactId: contact.id,
          channel: data.email ? "EMAIL" : "SMS",
        },
      });

      // Store initial message if provided
      if (data.message) {
        await prismaService.client.message.create({
          data: {
            conversationId: conversation.id,
            content: data.message,
            senderType: "CONTACT",
            senderId: contact.id,
          },
        });
      }
    }

    return contact;
  }

  /**
   * Update contact
   */
  async updateContact(contactId, workspaceId, data) {
    const contact = await prismaService.client.contact.findFirst({
      where: {
        id: contactId,
        workspaceId,
      },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    const updated = await prismaService.client.contact.update({
      where: { id: contactId },
      data: {
        firstName: data.name ? data.name.split(" ")[0] : undefined,
        lastName: data.name
          ? data.name.split(" ").slice(1).join(" ") || null
          : undefined,
        email: data.email,
        phone: data.phone,
      },
    });

    return updated;
  }

  /**
   * Delete contact
   */
  async deleteContact(contactId, workspaceId) {
    const contact = await prismaService.client.contact.findFirst({
      where: {
        id: contactId,
        workspaceId,
      },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    // Check if there are any active bookings
    const activeBookings = await prismaService.client.booking.count({
      where: {
        contactId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (activeBookings > 0) {
      throw new Error("Cannot delete contact with active bookings");
    }

    await prismaService.client.contact.delete({
      where: { id: contactId },
    });

    return { message: "Contact deleted successfully" };
  }

  /**
   * Get contact statistics
   */
  async getContactStats(contactId, workspaceId) {
    const contact = await prismaService.client.contact.findFirst({
      where: {
        id: contactId,
        workspaceId,
      },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    const [totalBookings, completedBookings, messageCount] = await Promise.all([
      prismaService.client.booking.count({
        where: { contactId },
      }),
      prismaService.client.booking.count({
        where: {
          contactId,
          status: "COMPLETED",
        },
      }),
      prismaService.client.message.count({
        where: {
          conversation: {
            contactId,
          },
        },
      }),
    ]);

    return {
      totalBookings,
      completedBookings,
      messageCount,
    };
  }
}

export default new ContactsService();
