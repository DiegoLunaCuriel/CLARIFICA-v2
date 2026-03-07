import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, sendVerificationEmail } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { generateVerificationCode, hashString } from '@/lib/server-utils';
import { authCrudOperations } from '@/lib/auth';
import { z } from 'zod';

const sendVerificationSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  type: z.enum(['register', 'reset-password']),
});

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = sendVerificationSchema.parse(body);

    const { usersCrud, userPasscodeCrud } = await authCrudOperations();

    if (validatedData.type === 'register') {
      const existingUsers = await usersCrud.findMany({ email: validatedData.email });
      if (existingUsers && existingUsers.length > 0) {
        return createErrorResponse({
          errorMessage: 'Este correo ya está registrado',
          status: 409,
        });
      }
    }

    if (validatedData.type === 'reset-password') {
      const existingUsers = await usersCrud.findMany({ email: validatedData.email });
      if (existingUsers && existingUsers.length === 0) {
        return createErrorResponse({
          errorMessage: 'Este correo no está registrado',
          status: 400,
        });
      }
    }

    const code = generateVerificationCode();

    const hashedCode = await hashString(code);

    try {
      await userPasscodeCrud.create({
        pass_object: validatedData.email,
        passcode: hashedCode,
        passcode_type: "EMAIL",
        valid_until: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
        revoked: false,
      });
    } catch (dbError: any) {
      console.error('[auth] Failed to store passcode in DB:', dbError?.message || dbError);
      return createErrorResponse({
        errorMessage: 'Error al guardar el código. Intenta de nuevo.',
        status: 500,
      });
    }

    const emailSent = await sendVerificationEmail(validatedData.email, code);
    if (!emailSent) {
      return createErrorResponse({
        errorMessage: 'No se pudo enviar el correo de verificación. Intenta de nuevo.',
        status: 500,
      });
    }

    return createSuccessResponse({ data: true });
  } catch (error: any) {
    console.error('[auth] send-verification error:', error?.message || error);

    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }

    return createErrorResponse({
      errorMessage: error?.message || 'Error al enviar el código. Intenta de nuevo.',
      status: 500,
    });
  }
}, false);
