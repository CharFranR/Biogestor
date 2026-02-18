"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { Button, Input } from "@/components/ui";
import { authService } from "@/lib/auth";
import type { RegisterData } from "@/types";

type RegisterFormData = RegisterData;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      console.log("Sending registration data:", data);
      await authService.register(data);

      toast.success(
        "Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador.",
        { duration: 5000 }
      );
      router.push("/login");
    } catch (error: unknown) {
      console.error("Register error:", error);
      const err = error as { response?: { data?: Record<string, string | string[]> } };
      
      // Handle DRF validation errors which come as field: [errors] or field: error
      if (err.response?.data) {
        const errorData = err.response.data;
        console.error("Server error response:", errorData);
        
        // Try to extract meaningful error messages
        const errorMessages: string[] = [];
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            errorMessages.push(`${field}: ${messages.join(", ")}`);
          } else if (typeof messages === "string") {
            errorMessages.push(`${field}: ${messages}`);
          }
        }
        
        if (errorMessages.length > 0) {
          toast.error(errorMessages.join("\n"), { duration: 6000 });
        } else {
          toast.error("Error al registrar. Verifica los datos e intenta de nuevo.");
        }
      } else {
        toast.error("Error al registrar. Verifica los datos e intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Crear Cuenta</h2>
        <p className="text-gray-500 mt-1">
          Completa el formulario para registrarte
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre"
            type="text"
            placeholder="Tu nombre"
            leftIcon={<FiUser className="w-5 h-5" />}
            error={errors.first_name?.message}
            {...register("first_name", {
              required: "El nombre es requerido",
            })}
          />

          <Input
            label="Apellido"
            type="text"
            placeholder="Tu apellido"
            error={errors.last_name?.message}
            {...register("last_name", {
              required: "El apellido es requerido",
            })}
          />
        </div>

        <Input
          label="Usuario"
          type="text"
          placeholder="Nombre de usuario"
          leftIcon={<FiUser className="w-5 h-5" />}
          error={errors.username?.message}
          {...register("username", {
            required: "El usuario es requerido",
            minLength: {
              value: 3,
              message: "Mínimo 3 caracteres",
            },
            pattern: {
              value: /^[a-zA-Z0-9_]+$/,
              message: "Solo letras, números y guiones bajos",
            },
          })}
        />

        <Input
          label="Correo Electrónico"
          type="email"
          placeholder="correo@ejemplo.com"
          leftIcon={<FiMail className="w-5 h-5" />}
          error={errors.email?.message}
          {...register("email", {
            required: "El correo es requerido",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Correo inválido",
            },
          })}
        />

        <div className="relative">
          <Input
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            leftIcon={<FiLock className="w-5 h-5" />}
            error={errors.password?.message}
            {...register("password", {
              required: "La contraseña es requerida",
              minLength: {
                value: 8,
                message: "Mínimo 8 caracteres",
              },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <FiEyeOff className="w-5 h-5" />
            ) : (
              <FiEye className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="relative">
          <Input
            label="Confirmar Contraseña"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Repite tu contraseña"
            leftIcon={<FiLock className="w-5 h-5" />}
            error={errors.password2?.message}
            {...register("password2", {
              required: "Confirma tu contraseña",
              validate: (value) =>
                value === password || "Las contraseñas no coinciden",
            })}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? (
              <FiEyeOff className="w-5 h-5" />
            ) : (
              <FiEye className="w-5 h-5" />
            )}
          </button>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Crear Cuenta
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          ¿Ya tienes una cuenta?{" "}
          <Link
            href="/login"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
