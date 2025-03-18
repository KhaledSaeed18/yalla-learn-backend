import { BlogStatus } from "@prisma/client";

export interface BlogPostUpdateData {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string | null;
    thumbnail?: string | null;
    status?: BlogStatus;
    readTime?: number | null;
    publishedAt?: Date | null;
    categories?: {
        set: [];
        connect: { id: string }[];
    };
}