"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { authService } from "@/lib/auth";
import type { LoginCredentials } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/sensores";

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);

      if (!response.user.perfil?.aprobado) {
        toast.error("Tu cuenta aún no ha sido aprobada por un administrador.");
        await authService.logout();
        return;
      }

      toast.success(`¡Bienvenido, ${response.user.first_name}!`);
      router.push(redirectTo);
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Usuario o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Iniciar Sesión</h2>
        <p className="text-gray-500 mt-1">Ingresa tus credenciales para continuar</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Usuario"
          type="text"
          placeholder="Ingresa tu usuario"
          leftIcon={<FiMail className="w-5 h-5" />}
          error={errors.username?.message}
          {...register("username", {
            required: "El usuario es requerido",
          })}
        />

        <div className="relative">
          <Input
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            placeholder="Ingresa tu contraseña"
            leftIcon={<FiLock className="w-5 h-5" />}
            error={errors.password?.message}
            {...register("password", {
              required: "La contraseña es requerida",
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

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Iniciar Sesión
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          ¿No tienes una cuenta?{" "}
          <Link
            href="/registro"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
