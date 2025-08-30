import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashingService {
  private readonly rounds = 12;
  hash(plain: string) { return bcrypt.hash(plain, this.rounds); }
  compare(plain: string, hash: string) { return bcrypt.compare(plain, hash); }
}
