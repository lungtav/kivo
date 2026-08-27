import { NotFoundError } from "../../shared/errors/NotFoundError.js";
import { ForbiddenError } from "../../shared/errors/ForbiddenError.js";
import { ValidationError } from "../../shared/errors/ValidationError.js";
import * as spacesRepository from "../spaces/spaces.repository.js";
import * as categoriesRepository from "../categories/categories.repository.js";
import * as channelsRepository from "../channels/channels.repository.js";
import type { CreateChannelInput } from "./channels.types.js";

export const createChannel = async (
  spaceId: string,
  userId: string,
  input: CreateChannelInput,
) => {
  const membership = await spacesRepository.getMembership(spaceId, userId);
  if (!membership) {
    throw new NotFoundError("space not found");
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new ForbiddenError("only owners and admins can create channels");
  }

  // check the category actually belongs to this space —
  // the gap a CHECK constraint can't cover, from earlier
  if (input.categoryId) {
    const category = await categoriesRepository.findCategoryById(
      input.categoryId,
    );
    if (!category || category.space_id !== spaceId) {
      throw new ValidationError("category does not belong to this space");
    }
  }

  const categoryId = input.categoryId ?? null;
  const nextPosition =
    (await channelsRepository.getMaxPosition(spaceId, categoryId)) + 1;

  const channel = await channelsRepository.createChannel(
    spaceId,
    input.name,
    userId,
    categoryId,
    nextPosition,
  );

  // creator auto-joins their own channel
  await channelsRepository.addChannelMember(channel.id, userId);

  return channel;
};

export const joinChannel = async (channelId: string, userId: string) => {
  const channel = await channelsRepository.findChannelById(channelId);
  if (!channel) {
    throw new NotFoundError("channel not found");
  }

  const spaceMembership = await spacesRepository.getMembership(channel.space_id, userId);
  if (!spaceMembership) {
    throw new NotFoundError("channel not found");
  }

  await channelsRepository.addChannelMember(channelId, userId);
  return channel;
};