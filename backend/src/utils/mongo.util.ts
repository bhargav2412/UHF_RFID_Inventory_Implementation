import { HttpStatus } from "@nestjs/common";
import { Types } from "mongoose";
import { CustomErrorException } from "src/exceptions/custom-error.exception";

export function stringToObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
        throw new CustomErrorException('Invalid id', HttpStatus.BAD_REQUEST);
    }
    return new Types.ObjectId(id);
}

export function toPlain<T>(dto: T): Record<string, any> {
    return dto instanceof Object ? { ...dto } : dto;
}
