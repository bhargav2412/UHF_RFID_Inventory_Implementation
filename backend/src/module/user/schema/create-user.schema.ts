import { UserRole } from "src/enum/role.enum";
import { z } from "zod";

export const CreateUserSchema = z.object({
    first_name: z.string().nonempty({ message: "First name cannot be empty." }),
    last_name: z.string().nonempty({ message: "Last name cannot be empty." }),
    email: z.string().email({ message: "Invalid email format." }),
    phone: z.string().optional().nullable(),
    role: z.nativeEnum(UserRole, { errorMap: () => ({ message: "Invalid Role" }) }),
    password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
});