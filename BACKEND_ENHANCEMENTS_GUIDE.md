# Backend Enhancements - Step-by-Step Guide

This guide walks you through implementing Swagger API Documentation (Task 2) and Pino Structured Logging (Task 3).

---

## 📋 Task 2: Add Swagger API Documentation

### Step 1: Install Required Packages

Run this command in the backend directory:

```bash
cd apps/backend
npm install @nestjs/swagger swagger-ui-express
```

### Step 2: Update main.ts with Swagger Configuration

**File:** `apps/backend/src/main.ts`

Add Swagger setup AFTER the existing app configuration:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // CORS configuration
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // ─── Swagger API Documentation ─────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('SmartBiz AI API')
    .setDescription(
      'Complete API documentation for SmartBiz AI - AI-powered business intelligence platform for SMEs. ' +
      'Includes authentication, financial data management, company valuation, and ML predictions.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication and authorization endpoints')
    .addTag('company', 'Company management endpoints')
    .addTag('financial', 'Financial data import and dashboard metrics')
    .addTag('valuation', 'Company valuation calculations and history')
    .addTag('prediction', 'ML-based predictions and forecasts')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });
  
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'SmartBiz AI API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });
  // ────────────────────────────────────────────────────────────────

  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`🚀 Application running on port ${process.env.PORT ?? 3000}`);
  console.log(`📚 API Documentation: http://localhost:${process.env.PORT ?? 3000}/api/docs`);
}
bootstrap();
```

### Step 3: Add Swagger Decorators to Controllers

#### A. Auth Controller

**File:** `apps/backend/src/auth/auth.controller.ts`

Add these imports at the top:

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
```

Add decorators to the controller class:

```typescript
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  // ... existing code
}
```

Add decorators to each endpoint:

```typescript
@Post('register')
@ApiOperation({ summary: 'Register a new user with company creation' })
@ApiResponse({ status: 201, description: 'User registered successfully' })
@ApiResponse({ status: 400, description: 'Invalid input or email already exists' })
@ApiBody({ type: RegisterDto })
async register(@Body() registerDto: RegisterDto) {
  // ... existing implementation
}

@Post('login')
@ApiOperation({ summary: 'Authenticate user and return JWT tokens' })
@ApiResponse({ status: 200, description: 'Login successful' })
@ApiResponse({ status: 401, description: 'Invalid credentials' })
@ApiBody({ type: LoginDto })
async login(@Body() loginDto: LoginDto) {
  // ... existing implementation
}

@Post('refresh')
@ApiOperation({ summary: 'Refresh access token using refresh token' })
@ApiResponse({ status: 200, description: 'New access token generated' })
async refreshToken(@Body() body: { refreshToken: string }) {
  // ... existing implementation
}

@Get('me')
@ApiOperation({ summary: 'Get current authenticated user profile' })
@ApiResponse({ status: 200, description: 'User profile retrieved' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@ApiBearerAuth('JWT-auth')
async getMe(@CurrentUser() user: any) {
  // ... existing implementation
}
```

#### B. Financial Controller

**File:** `apps/backend/src/financial/financial.controller.ts`

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('financial')
@ApiBearerAuth('JWT-auth')
@Controller('financial')
export class FinancialController {
  
  @Post('import')
  @ApiOperation({ summary: 'Import financial data from Excel file' })
  @ApiResponse({ status: 200, description: 'Data imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or missing required sheets' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file with financial data',
        },
      },
    },
  })
  async importData(@UploadedFile() file: Express.Multer.File) {
    // ... existing implementation
  }

  @Get('dashboard-metrics')
  @ApiOperation({ summary: 'Get dashboard metrics (latest import)' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved' })
  async getDashboardMetrics(@CurrentUser() user: any) {
    // ... existing implementation
  }

  @Get('template')
  @ApiOperation({ summary: 'Download Excel template for financial data' })
  @ApiResponse({ status: 200, description: 'Template file downloaded' })
  async downloadTemplate() {
    // ... existing implementation
  }
}
```

### Step 4: Add ApiProperty Decorators to DTOs

#### Register DTO

**File:** `apps/backend/src/auth/dto/register.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ 
    example: 'john.doe@example.com',
    description: 'User email address' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'John',
    description: 'User first name' 
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ 
    example: 'Doe',
    description: 'User last name' 
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ 
    example: 'Password123!',
    description: 'User password (min 8 chars)' 
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ 
    example: 'TechCorp',
    description: 'Company name' 
  })
  @IsString()
  @IsNotEmpty()
  companyName: string;
}
```

#### Login DTO

**File:** `apps/backend/src/auth/dto/login.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ 
    example: 'john.doe@example.com',
    description: 'User email address' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'Password123!',
    description: 'User password' 
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
```

### Step 5: Test Swagger Documentation

1. Start the backend server:
```bash
cd apps/backend
npm run start:dev
```

2. Open your browser to:
```
http://localhost:3000/api/docs
```

3. You should see:
   - Interactive API documentation
   - All endpoints organized by tags
   - Try it out functionality
   - JWT authentication support

---

## 📋 Task 3: Implement Structured Logging with Pino

### Step 1: Install Pino Packages

```bash
cd apps/backend
npm install nestjs-pino pino-http pino-pretty
```

### Step 2: Create Logger Module

**Create file:** `apps/backend/src/common/common.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport: process.env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            headers: req.headers,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
        customSuccessMessage: (req, res, responseTime) => {
          return `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`;
        },
        customErrorMessage: (req, res, err, responseTime) => {
          return `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms - ${err.message}`;
        },
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class CommonModule {}
```

### Step 3: Update app.module.ts to Import CommonModule

**File:** `apps/backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { CompanyModule } from './company/company.module';
import { FinancialModule } from './financial/financial.module';
import { ValuationModule } from './valuation/valuation.module';
import { PredictionModule } from './prediction/prediction.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    CommonModule,  // ← Add this line
    PrismaModule,
    AuthModule,
    CompanyModule,
    FinancialModule,
    ValuationModule,
    PredictionModule,
    MailModule,
  ],
})
export class AppModule {}
```

### Step 4: Use Logger in Services

**Example:** Update any service to use structured logging

**File:** `apps/backend/src/financial/financial.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { LoggerService } from 'nestjs-pino';

@Injectable()
export class FinancialService {
  private readonly logger: Logger;

  constructor(
    private readonly prisma: PrismaService,
    private readonly loggerService: LoggerService,
  ) {
    this.logger = new Logger(FinancialService.name);
  }

  async processBimodalImport(fileBuffer: Buffer, companyId: string, userId: string) {
    this.loggerService.info({
      msg: 'Starting financial data import',
      companyId,
      userId,
      fileSize: fileBuffer.length,
    });

    try {
      // ... existing import logic
      
      this.loggerService.info({
        msg: 'Financial data import completed successfully',
        companyId,
        batchId: batch.id,
        recordsProcessed: financialDataRecords.length,
      });

      return {
        success: true,
        batchId: batch.id,
        recordsProcessed: financialDataRecords.length,
      };
    } catch (error) {
      this.loggerService.error({
        msg: 'Financial data import failed',
        error: error.message,
        stack: error.stack,
        companyId,
        userId,
      });

      throw error;
    }
  }

  async getDashboardMetrics(companyId: string, batchId?: string) {
    this.loggerService.debug({
      msg: 'Fetching dashboard metrics',
      companyId,
      batchId: batchId || 'latest',
    });

    // ... existing implementation
  }
}
```

### Step 5: Update Environment Variables

**Add to** `apps/backend/.env`:

```env
# Logging Configuration
LOG_LEVEL=debug
NODE_ENV=development
```

**Add to** `apps/backend/.env.production`:

```env
# Logging Configuration
LOG_LEVEL=info
NODE_ENV=production
```

### Step 6: Test Structured Logging

1. Start the backend:
```bash
npm run start:dev
```

2. Make an API request:
```bash
curl http://localhost:3000/api/v1/financial/dashboard-metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

3. You should see beautiful structured logs:
```
[2026-04-13 10:30:45.123 +0000] INFO (12345): GET /api/v1/financial/dashboard-metrics 200 - 45ms
    req: {
      "id": "req-123",
      "method": "GET",
      "url": "/api/v1/financial/dashboard-metrics"
    }
    res: {
      "statusCode": 200
    }
```

---

## 📋 Task 4: Enhance Input Validation

### Step 1: Review and Improve All DTOs

Already done! Your current DTOs use `class-validator` with proper decorators.

### Step 2: Add Custom Error Messages

**Example for Financial Import DTO:**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class ImportFinancialDto {
  @ApiProperty({
    description: 'Excel file containing financial data',
    type: 'string',
    format: 'binary',
  })
  @IsNotEmpty({ message: 'File is required' })
  file: Express.Multer.File;
}
```

### Step 3: Add File Validation

**In Financial Controller:**

```typescript
@UseInterceptors(FileInterceptor('file'))
@Post('import')
async importData(
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: UserPayload,
) {
  // File size validation (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new BadRequestException('File size must be less than 10MB');
  }

  // File type validation
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestException('Only Excel files (.xlsx, .xls) are allowed');
  }

  return this.financialService.processBimodalImport(
    file.buffer,
    user.companyId,
    user.id,
  );
}
```

---

## ✅ Completion Checklist

### Task 2: Swagger API Documentation
- [ ] Install @nestjs/swagger and swagger-ui-express
- [ ] Update main.ts with Swagger configuration
- [ ] Add @ApiTags to all controllers
- [ ] Add @ApiOperation and @ApiResponse to endpoints
- [ ] Add @ApiProperty to all DTOs
- [ ] Add @ApiBearerAuth to protected endpoints
- [ ] Test at http://localhost:3000/api/docs

### Task 3: Pino Structured Logging
- [ ] Install nestjs-pino, pino-http, pino-pretty
- [ ] Create CommonModule with Pino configuration
- [ ] Import CommonModule in AppModule
- [ ] Replace console.log with loggerService in services
- [ ] Add structured logging to key operations
- [ ] Test logs are working and formatted correctly

### Task 4: Enhanced Input Validation
- [ ] Review all DTOs for proper validation
- [ ] Add custom error messages
- [ ] Add file size and type validation
- [ ] Test validation errors are user-friendly

---

## 🚀 Quick Start Commands

```bash
# Navigate to backend
cd apps/backend

# Install all required packages
npm install @nestjs/swagger swagger-ui-express nestjs-pino pino-http pino-pretty

# Start development server
npm run start:dev

# Test Swagger docs
# Open: http://localhost:3000/api/docs

# Test logging
# Make any API request and check console output
```

---

## 📊 Expected Results

### After Task 2 (Swagger):
✅ Interactive API documentation at `/api/docs`  
✅ All endpoints documented with examples  
✅ Try it out functionality for testing  
✅ JWT authentication support  

### After Task 3 (Pino Logging):
✅ Beautiful structured logs in development  
✅ JSON logs in production (for log aggregation)  
✅ Request/response logging automatically  
✅ Error tracking with stack traces  

### After Task 4 (Validation):
✅ Better error messages for users  
✅ File upload validation  
✅ Prevents invalid data  
✅ Security improvements  

---

## 💡 Tips

1. **Swagger**: Use `@ApiOptionalProperty()` for optional fields in DTOs
2. **Logging**: Use `logger.debug()` for verbose logs, `logger.info()` for important events, `logger.error()` for errors
3. **Validation**: Always validate file uploads to prevent security issues
4. **Production**: Set `LOG_LEVEL=info` to reduce log volume

---

**Ready to implement!** Start with Task 2 (Swagger) as it's the quickest win, then move to Task 3 (Logging).
