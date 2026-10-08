import { createZodDto } from "nestjs-zod";
import { ApiProperty } from "@nestjs/swagger";
import { Types } from "mongoose";
import { verifyOtpSchema } from "../schema/verifyOtp.schema";

export class VerifyOtpDto extends createZodDto(verifyOtpSchema) {

    @ApiProperty({ description: "The id of user" })
    userId: Types.ObjectId;

    @ApiProperty({ description: "The OTP sent to user" })
    otp: number;
}
