import { ROLES_ENUM } from "@/lib/constants";
import { z } from "zod";


export const registerSchema = z.object({
    email: z.string().email().min(1),
    name: z.string().min(3),
    password: z.string().min(1),
    confirmPassword: z.string().min(1),
    role: z.union([z.literal(ROLES_ENUM.ADMIN), z.literal(ROLES_ENUM.CUSTOMER), z.literal(ROLES_ENUM.STORE_MANAGER), z.literal(ROLES_ENUM.DELIVERY)])
}).superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password is not the same as confirm password',
            path: ['confirmPassword'],
        })
    }
});

export const loginSchema = z.object({
    email: z.string().email().min(1),
    password: z.string().min(1),
})


// export type TRegisterSchema = z.infer<typeof registerSchema>;
// export type TRegisterResponse = {
//     message: string,
//     user: {
//         email: string,
//         name: string,
//         role: string,
//     }
// }

// export type TLoginResponse = {
//     message: string,
//     tokens: {
//         access: string;
//         refresh: string;
//     }
//     detail?: string
// }
// export type TLoginSchema = z.infer<typeof loginSchema>;

