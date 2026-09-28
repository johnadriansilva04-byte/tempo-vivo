import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Phone,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";

interface ValidationErrors {
  name?: string | undefined;
  age?: string | undefined;
  phone?: string | undefined;
}

export function CreateProfilePage() {
  const { profile } = useProfile();
  const upsert = useUpdateProfile();
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    age: profile?.birth_date
      ? String(
          new Date().getFullYear() - new Date(profile.birth_date).getFullYear(),
        )
      : "",
    phone: profile?.phone || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const validatePhone = (phone: string): boolean => {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, "");
    // Valida se tem 10 ou 11 dígitos (com ou sem DDD)
    return cleanPhone.length === 10 || cleanPhone.length === 11;
  };

  const validateAge = (age: string): boolean => {
    const ageNum = parseInt(age, 10);
    return !isNaN(ageNum) && ageNum >= 1 && ageNum <= 120;
  };

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!validateName(formData.name)) {
      newErrors.name = "Nome deve ter pelo menos 2 caracteres";
    }

    if (!validateAge(formData.age)) {
      newErrors.age = "Idade deve estar entre 1 e 120 anos";
    }

    if (!validatePhone(formData.phone)) {
      newErrors.phone = "Telefone inválido. Use formato (XX) XXXXX-XXXX";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const birthDate = formData.age
        ? new Date(new Date().getFullYear() - parseInt(formData.age, 10), 0, 1)
            .toISOString()
            .slice(0, 10)
        : "";

      await upsert.mutateAsync({
        name: formData.name,
        birth_date: birthDate,
        phone: formData.phone,
      });

      setShowSuccess(true);

      // Redirect to home after successful save
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      console.error("Error saving profile:", error);
      setErrors({ name: "Erro ao salvar perfil. Tente novamente." });
    } finally {
      setIsSaving(false);
    }
  };

  const formatPhone = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");

    if (cleanValue.length <= 2) {
      return cleanValue;
    } else if (cleanValue.length <= 7) {
      return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
    } else {
      return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
    // Limpar erro de telefone quando o usuário começa a corrigir
    if (errors.phone) {
      setErrors({ ...errors, phone: undefined });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
    if (errors.name) {
      setErrors({ ...errors, name: undefined });
    }
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setFormData({ ...formData, age: value });
    if (errors.age) {
      setErrors({ ...errors, age: undefined });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <Card className="border-2 border-purple-500/30">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Criar seu Perfil</CardTitle>
            <CardDescription>
              Preencha suas informações para começar sua jornada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nome completo
                </Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                  className={
                    errors.name
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {errors.name && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-medium">
                  Idade
                </Label>
                <Input
                  id="age"
                  type="text"
                  placeholder="Sua idade"
                  value={formData.age}
                  onChange={handleAgeChange}
                  required
                  min="1"
                  max="120"
                  className={
                    errors.age
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {errors.age && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.age}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Telefone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  required
                  className={
                    errors.phone
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {showSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-md flex items-center gap-2 text-green-500 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Perfil criado com sucesso!</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Criar Perfil
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = "/")}
                >
                  Voltar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            <Sparkles className="inline h-4 w-4 mr-1" />
            Seus dados ficam 100% privados no seu dispositivo
          </p>
        </div>
      </div>
    </div>
  );
}
