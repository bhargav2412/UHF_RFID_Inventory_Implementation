import { ApiProperty } from "@nestjs/swagger";

export class LoginResponseDto {
    
    @ApiProperty({ description: "The id of the user" })
    id: number;

    @ApiProperty({ description: "The auth token of the user" })
    auth_token: string;
}
