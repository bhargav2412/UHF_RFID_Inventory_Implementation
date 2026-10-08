import { createZodDto } from "nestjs-zod";
import { loginSchema } from "../schema/login.schema";
import { ApiProperty } from "@nestjs/swagger";
import { loginOtpSchema } from "../schema/loginOtp.schema";

export class LoginOtpDto extends createZodDto(loginOtpSchema) {
    @ApiProperty({ description: "The phone number of the user" })
    phone: string;
}
