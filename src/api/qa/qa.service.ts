import { PrismaClient } from "@prisma/client";

export class QAService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    // Tag methods
    
    // Create a new tag (admin only)
    public async createTag(name: string) {
        const existingTag = await this.prisma.tag.findUnique({
            where: { name }
        });

        if (existingTag) {
            throw new Error("Tag with this name already exists");
        }

        const tag = await this.prisma.tag.create({
            data: { name }
        });

        return tag;
    }

    // Get all tags
    public async getTags() {
        const tags = await this.prisma.tag.findMany({
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        questions: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return tags.map(tag => ({
            id: tag.id,
            name: tag.name,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt,
            questionCount: tag._count.questions
        }));
    }

    // Delete a tag (admin only)
    public async deleteTag(id: string) {
        const tag = await this.prisma.tag.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        questions: true
                    }
                }
            }
        });

        if (!tag) {
            throw new Error("Tag not found");
        }

        if (tag._count.questions > 0) {
            throw new Error("Cannot delete tag that is associated with questions");
        }

        await this.prisma.tag.delete({
            where: { id }
        });

        return { id };
    }
}