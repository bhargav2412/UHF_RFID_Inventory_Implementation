import { createZodDto } from "nestjs-zod";
import { loginSchema } from "../schema/login.schema";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto extends createZodDto(loginSchema) {
    
    @ApiProperty({ description: "The email of the user" })
    email: string;

    @ApiProperty({ description: "The password of the user" })
    password: string;
}
