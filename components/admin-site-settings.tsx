"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSiteSettings } from "@/lib/actions";
import type { Database } from "@/lib/supabase/database.types";

type Settings = Database["public"]["Tables"]["site_settings"]["Row"];

const DEFAULT_INTERVIEW_TEMPLATE =
  'ສະບາຍດີ {ຊື່}, ທ່ານໄດ້ຮັບການນັດໝາຍສຳພາດງານສຳລັບຕຳແໜ່ງ "{ຕຳແໜ່ງ}" ວັນທີ {ວັນທີ} ເວລາ {ເວລາ} ນາລິກາ. ກະລຸນາກຽມຕົວມາຕາມນັດ. ຂອບໃຈ, {ອົງກອນ}';

export function AdminSiteSettings({ settings }: { settings: Settings | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [orgNameLo, setOrgNameLo] = useState(settings?.org_name_lo ?? "");
  const [orgNameEn, setOrgNameEn] = useState(settings?.org_name_en ?? "");
  const [orgAbbreviation, setOrgAbbreviation] = useState(settings?.org_abbreviation ?? "");
  const [phone, setPhone] = useState(settings?.phone ?? "");
  const [hotline, setHotline] = useState(settings?.hotline ?? "");
  const [facebookUrl, setFacebookUrl] = useState(settings?.facebook_url ?? "");
  const [tiktokUrl, setTiktokUrl] = useState(settings?.tiktok_url ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(settings?.youtube_url ?? "");
  const [interviewMessageTemplate, setInterviewMessageTemplate] = useState(
    settings?.interview_message_template ?? DEFAULT_INTERVIEW_TEMPLATE
  );
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await updateSiteSettings({
        orgNameLo,
        orgNameEn,
        orgAbbreviation,
        phone,
        hotline,
        facebookUrl,
        tiktokUrl,
        youtubeUrl,
        interviewMessageTemplate,
      });
      router.refresh();
      setSaved(true);
    });
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold">ຂໍ້ມູນສະມາຄົມ ແລະ ຊ່ອງທາງຕິດຕໍ່</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ຂໍ້ມູນນີ້ຈະສະແດງຢູ່ໜ້າຫຼັກ, ໜ້າ &quot;ກ່ຽວກັບ&quot; ແລະ ສ່ວນທ້າຍຂອງທຸກໜ້າ
      </p>

      <Card className="mt-6">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1.5">
            <Label>ຊື່ສະມາຄົມ (ພາສາລາວ)</Label>
            <Input value={orgNameLo} onChange={(e) => setOrgNameLo(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>ຊື່ສະມາຄົມ (ພາສາອັງກິດ)</Label>
            <Input value={orgNameEn} onChange={(e) => setOrgNameEn(e.target.value)} placeholder="Lao Employment Business Association" />
          </div>
          <div className="space-y-1.5">
            <Label>ຕົວຫຍໍ້</Label>
            <Input value={orgAbbreviation} onChange={(e) => setOrgAbbreviation(e.target.value)} placeholder="LEBA" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ເບີໂທ/WhatsApp</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="020 28868688" />
            </div>
            <div className="space-y-1.5">
              <Label>ສາຍດ່ວນ</Label>
              <Input value={hotline} onChange={(e) => setHotline(e.target.value)} placeholder="1505" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>ລິ້ງ Facebook</Label>
            <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label>ລິ້ງ TikTok</Label>
            <Input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/@..." />
          </div>
          <div className="space-y-1.5">
            <Label>ລິ້ງ YouTube</Label>
            <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/@..." />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="space-y-3 pt-6">
          <div>
            <h2 className="font-semibold">ຂໍ້ຄວາມນັດສຳພາດຜ່ານ WhatsApp</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ຂໍ້ຄວາມນີ້ຈະຖືກສົ່ງໃຫ້ຜູ້ສະໝັກອັດຕະໂນມັດຕອນແອັດມິນກົດ &quot;ນັດສຳພາດ&quot;. ໃຊ້ຄຳເຫຼົ່ານີ້ແທນຂໍ້ມູນຈິງ:{" "}
              <code className="rounded bg-muted px-1">{"{ຊື່}"}</code>{" "}
              <code className="rounded bg-muted px-1">{"{ຕຳແໜ່ງ}"}</code>{" "}
              <code className="rounded bg-muted px-1">{"{ວັນທີ}"}</code>{" "}
              <code className="rounded bg-muted px-1">{"{ເວລາ}"}</code>{" "}
              <code className="rounded bg-muted px-1">{"{ອົງກອນ}"}</code>
            </p>
          </div>
          <Textarea
            rows={5}
            value={interviewMessageTemplate}
            onChange={(e) => setInterviewMessageTemplate(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setInterviewMessageTemplate(DEFAULT_INTERVIEW_TEMPLATE)}
          >
            ຄືນຄ່າເລີ່ມຕົ້ນ
          </Button>
        </CardContent>
      </Card>

      {saved && <p className="mt-4 text-sm text-emerald-600">✅ ບັນທຶກແລ້ວ</p>}

      <Button
        onClick={handleSave}
        disabled={isPending}
        className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {isPending ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກ"}
      </Button>
    </div>
  );
}
