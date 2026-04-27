import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: "L'email fourni n'est pas valide." })
  @IsNotEmpty({ message: "L'email est requis." })
  email: string;
}
