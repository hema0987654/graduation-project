import { Module } from '@nestjs/common';
import Redis from 'ioredis';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const client = new Redis({
          host: '127.0.0.1',
          port: 6379,
          retryStrategy(times) {
            return Math.min(times * 50, 2000);
          },
        });

        client.on('error', (err) => {
          console.error('Redis connection error', err);
        });

        return client;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
