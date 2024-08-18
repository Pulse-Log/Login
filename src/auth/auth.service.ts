import { MailerService } from '@nestjs-modules/mailer';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SignUpDto } from './dto/sign_up.dto';
import { Credentials } from './entity/credentials.entity';
import { readFile } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Credentials)
    private readonly credentialsRepository: Repository<Credentials>,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  /**
   * Creates a new user account.
   * @param signUpDto - The user's sign-up information.
   * @returns An object containing a success message and an access token if the sign-up is successful, or an error message if it fails.
   */
  async signup(signUpDto: SignUpDto) {
    try {
      const user = await this.credentialsRepository.findOne({
        where: { email: signUpDto.email },
      });
      if (user && user.isVerified) {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }else if(user){
        await this.credentialsRepository.remove(user);
      }
      const credentials = new Credentials();
      credentials.email = signUpDto.email;
      const hashPass = await bcrypt.hash(signUpDto.password, 10);
      credentials.password = hashPass;
      const confirmationToken = uuidv4();
      credentials.confirmationToken = confirmationToken.toString();
      // const payload = { email: signUpDto.email, password: signUpDto.password };
      // const token = await this.jwtService.signAsync(payload);
      await this.sendVerificationEmail(signUpDto.email, confirmationToken);
      await this.credentialsRepository.save(credentials);
      console.log(confirmationToken + ' from regi');
      return 'Registration successful. Please check your email for verification.';
    } catch (err) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async sendVerificationEmail(email: string, token: string) {
  const verificationLink = `https://auth.logix.corevision.live/auth/v1/confirm?token=${token}`;
  // const verificationLink = `http://localhost:3001/auth/v1/confirm?token=${token}`;
  // Read the HTML template (you'll need to implement this method)
  let emailTemplate = await this.readEmailTemplate();
  
  // Replace the placeholder with the actual verification link
  emailTemplate = emailTemplate.replace('{{verificationLink}}', verificationLink);

  await this.mailerService.sendMail({
    from: {
      name: "No reply",
      address: "MS_Ntiun0@trial-neqvygmypyjg0p7w.mlsender.net"
    },
    to: email,
    subject: 'Verify Your Email Address',
    html: emailTemplate,
  });
}

 

// Add this method to your AuthService class
async readEmailTemplate(): Promise<string> {
  const templatePath = join(process.cwd(), 'templates', 'emails', 'email-verification.html');
  return await readFile(templatePath, 'utf8');
}

  /**
   * Authenticates a user using their email and password.
   * @param signUpDto - The user's email and password.
   * @returns An access token if the authentication is successful, or an error message if it fails.
   */
  async login(signUpDto: SignUpDto) {
    try {
      const user = await this.credentialsRepository.findOne({
        where: { email: signUpDto.email },
      });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
      }
      if (!(await bcrypt.compare(signUpDto.password, user.password))) {
        throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }
      if (!user.isVerified) {
        await this.sendVerificationEmail(user.email, user.confirmationToken);
        return 'Verification needed. Please check your email for verification.';
      }
      const payload = { email: signUpDto.email, userId: user._id };
      const token = await this.jwtService.signAsync(payload);
      return {
        user_id: user._id,
        accessToken: token,
      };
    } catch (err) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async confirmEmail(token: string){
    try {
      const user = await this.credentialsRepository.findOne({
        where: { confirmationToken: token },
      });
      if (!user) {
        throw new HttpException(
          'Invalid confirmation token',
          HttpStatus.BAD_REQUEST,
        );
      }
      user.isVerified = true;
      user.confirmationToken = null;
      await this.credentialsRepository.save(user);
      const payload = { email: user.email, userId: user._id };
      const jwtToken = await this.jwtService.signAsync(payload);
      return {
        accessToken: jwtToken,
        userId: user._id
      };
    } catch (err) {
      throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
