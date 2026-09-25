import { useMemo, useState } from "react";
import { RECOVERY_QUESTIONS } from "@/lib/recovery";
import { signupProgress } from "@/lib/signup-progress";
import type { SignupBlockId } from "@/components/auth/copy";

// ---------------------------------------------------------------------------
// Estado do cadastro, num lugar só.
//
// O formulário de cadastro tem sete campos e três blocos. Guardar isso dentro do
// componente da tela misturava "o que estou preenchendo" com "em que modo estou",
// então o rascunho virou um hook: a tela decide o modo, o hook decide o cadastro.
// ---------------------------------------------------------------------------

export type SignupDraftState = ReturnType<typeof useSignupDraft>;

export function useSignupDraft() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [question, setQuestion] = useState<string>(RECOVERY_QUESTIONS[0] ?? "");
  const [customQuestion, setCustomQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [openBlock, setOpenBlock] = useState<SignupBlockId | "">("identity");

  /** Pergunta efetiva: a escolhida na lista ou a escrita à mão. */
  const chosenQuestion = customQuestion.trim() || question;

  const progress = useMemo(
    () =>
      signupProgress({
        name,
        age,
        phone,
        password,
        confirm,
        question: chosenQuestion,
        answer,
      }),
    [name, age, phone, password, confirm, chosenQuestion, answer],
  );

  const reset = () => {
    setName("");
    setAge("");
    setPhone("");
    setPassword("");
    setConfirm("");
    setCustomQuestion("");
    setAnswer("");
    setOpenBlock("identity");
  };

  return {
    name,
    setName,
    age,
    setAge,
    phone,
    setPhone,
    password,
    setPassword,
    confirm,
    setConfirm,
    question,
    setQuestion,
    customQuestion,
    setCustomQuestion,
    answer,
    setAnswer,
    chosenQuestion,
    showPassword,
    setShowPassword,
    openBlock,
    setOpenBlock,
    progress,
    reset,
  };
}
