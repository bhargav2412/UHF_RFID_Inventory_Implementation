import * as bcrypt from 'bcryptjs';
export class PasswordUtil {
  constructor(private readonly hashCode: string = process.env.BCRYPT_SALT) { }
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, Number(this.hashCode));
  }
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}