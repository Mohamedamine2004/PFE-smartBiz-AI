import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est requis.' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom de famille est requis.' })
  lastName: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom de l\'entreprise est requis.' })
  companyName: string;

  @IsString()
  @IsNotEmpty({ message: 'Le matricule fiscal est requis.' })
  registrationNumber: string;

  @IsEmail({}, { message: 'L\'adresse email doit être valide.' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  password: string;
}