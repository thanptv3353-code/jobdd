"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInMember, signUpMember } from "@/lib/actions";

export default function MemberLoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [signedUp, setSignedUp] = useState(false);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result =
        mode === "signin" ? await signInMember(email, password) : await signUpMember(email, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (mode === "signup") {
        setSignedUp(true);
        return;
      }
      router.push("/member");
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6">
          <div className="mb-6 flex items-center gap-2">
            <Image src="/jobdd-logo.png" alt="Job DD" width={36} height={36} className="rounded-lg" />
            <span className="text-lg font-bold">Job DD ບໍລິສັດ</span>
          </div>

          {signedUp ? (
            <div className="space-y-3 text-sm">
              <p className="font-medium text-emerald-700">ສະໝັກບັນຊີສຳເລັດແລ້ວ</p>
              <p className="text-muted-foreground">
                ຂັ້ນຕໍ່ໄປ ໃຫ້ແຈ້ງ Job DD ເພື່ອຜູກບັນຊີນີ້ກັບບໍລິສັດຂອງທ່ານ ຈຶ່ງຈະເຂົ້າໃຊ້ໄດ້
              </p>
              <Button className="w-full" variant="outline" onClick={() => setMode("signin")}>
                ໄປໜ້າ login
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>ອີເມວ</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>ລະຫັດຜ່ານ</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isPending || !email || !password}
                onClick={handleSubmit}
              >
                {isPending ? "ກຳລັງດຳເນີນການ..." : mode === "signin" ? "ເຂົ້າສູ່ລະບົບ" : "ສະໝັກບັນຊີ"}
              </Button>
              <button
                type="button"
                className="w-full text-center text-xs text-muted-foreground hover:underline"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "ຍັງບໍ່ມີບັນຊີ? ສະໝັກທີ່ນີ້" : "ມີບັນຊີແລ້ວ? ເຂົ້າສູ່ລະບົບ"}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
