import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { AttributeRepository, Attribute } from '@boost/database';
import { CreateAttributeDto } from './dto/create-attribute.dto';

@Injectable()
export class AttributesService {
  constructor(private readonly attributeRepository: AttributeRepository) {}

  async create(projectId: string, dto: CreateAttributeDto): Promise<Attribute> {
    // Check for duplicate name
    const existing = await this.attributeRepository.findByName(
      projectId,
      dto.name,
    );
    if (existing) {
      throw new ConflictException(`Attribute "${dto.name}" already exists`);
    }

    const { id } = await this.attributeRepository.create({
      projectId,
      ...dto,
    });

    const attribute = await this.attributeRepository.findById(id);
    if (!attribute) {
      throw new Error('Failed to create attribute');
    }

    return attribute;
  }

  async list(projectId: string): Promise<Attribute[]> {
    return this.attributeRepository.findByProjectId(projectId);
  }

  async findOne(projectId: string, id: string): Promise<Attribute> {
    const attribute = await this.attributeRepository.findById(id);

    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }

    if (attribute.projectId !== projectId) {
      throw new ForbiddenException('Access denied');
    }

    return attribute;
  }

  async delete(projectId: string, id: string): Promise<void> {
    const attribute = await this.findOne(projectId, id);
    await this.attributeRepository.delete(attribute.id);
  }
}
