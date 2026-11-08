import z from "zod";

/**
 * Document as returned by GET /api/doc. Nullable database columns are
 * tolerated: pages and size may be null, description may be null.
 * `size` arrives as a number (MB) from the upload job payload and as the
 * raw column value from the list endpoint, so both are accepted.
 */
const doc = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  pages: z.number().nullish(),
  size: z.union([z.number(), z.string()]).nullish(),
  createdAt: z.string(),
});

const docSchema = z.array(doc);

const docSchemaResponse = z.object({
  response: docSchema,
});

const docCreationSchema = z.object({
  name: z
    .string()
    .min(1, "Give the document a title.")
    .max(150, "Keep the title under 150 characters."),
  description: z
    .string()
    .max(256, "Keep the description under 256 characters.")
    .optional(),
  document: z
    .instanceof(File, { message: "Attach a PDF to upload." })
    .refine((f) => f.type === "application/pdf", "Only PDF files are supported.")
    .refine(
      (f) => f.size <= 5 * 1024 * 1024,
      "That file is larger than the 5 MB limit."
    ),
});

const chatsSchema = z.object({
  id: z.string(),
  docId: z.string(),
  aiResponse: z.string(),
  usersResponse: z.string(),
  createdAt: z.string().datetime(),
});

const chatsDataSchema = z.object({
  doc,
  chats: z.array(chatsSchema),
});

/** Conversation entry as returned by GET /api/conversations/:docId. */
const conversation = z.object({
  conversation: z.object({
    // Included by the backend; optional keeps the parser tolerant of older
    // responses where only the title was returned.
    id: z.string().optional(),
    title: z.string(),
  }),
});

const conversationSchema = z.array(conversation);

/**
 * Verified response of GET /api/conversations/:docId:
 * { success, data: { convos: [{ conversation }], doc: [{ id, title, url, … }] } }
 * The doc rows include the url column, which powers the PDF viewer.
 */
const conversationSchemaResponse = z.object({
  success: z.boolean().optional(),
  data: z.object({
    convos: conversationSchema,
    doc: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string().nullish(),
        description: z.string().nullish(),
        pages: z.number().nullish(),
        size: z.union([z.number(), z.string()]).nullish(),
        createdAt: z.string(),
      })
    ),
  }),
});

/**
 * Chat history as returned by GET /api/chats/:docId/:conversationId.
 * Shape verified from chat.controller.ts: nested { doc: [{ doc, conversationId }], chats: [{ chats }] }.
 */
const chatHistorySchema = z.object({
  doc: z.array(
    z.object({
      doc: z.object({
        id: z.string(),
        title: z.string(),
        pages: z.number().nullish(),
        size: z.union([z.number(), z.string()]).nullish(),
        description: z.string().nullish(),
        createdAt: z.string(),
      }),
      conversationId: z.string().optional(),
    })
  ),
  chats: z.array(
    z.object({
      chats: z.object({
        id: z.string(),
        conversationId: z.string().optional(),
        aiResponse: z.string(),
        usersResponse: z.string(),
        createdAt: z.string(),
      }),
    })
  ),
});

const chatHistorySchemaResponse = z.object({
  success: z.boolean().optional(),
  data: chatHistorySchema,
});

export {
  doc,
  docSchema,
  docSchemaResponse,
  docCreationSchema,
  chatsSchema,
  chatsDataSchema,
  conversation,
  conversationSchema,
  conversationSchemaResponse,
  chatHistorySchema,
  chatHistorySchemaResponse,
};
