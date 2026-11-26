"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { saveChannelProfile } from "@/lib/actions/creator";
import { Button, Card, Field, SelectInput, TextArea, TextInput, choiceClass } from "@/components/ui";
import { CHANNEL_ABOUT_MAX, channelStyles, type ChannelProfile, type ChannelStyle } from "@/lib/channel-profile";

export function ChannelProfileCard({ channel, configured, missing }: { channel: ChannelProfile; configured: boolean; missing: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState(channel);
  const [saving, setSaving] = useState(false);
  const patch = (partial: Partial<ChannelProfile>) => setForm((current) => ({ ...current, ...partial }));

  function toggleStyle(style: ChannelStyle) {
    setForm((current) => {
      const on = current.styles.includes(style);
      if (!on && current.styles.length >= 3) {
        toast.error("Pick up to 3 styles.");
        return current;
      }
      return { ...current, styles: on ? current.styles.filter((item) => item !== style) : [...current.styles, style] };
    });
  }

  return (
    <Card className="grid gap-5" >
      <div id="channel" className="flex scroll-mt-24 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-semibold">About my channel</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Tell the AI what your channel is about. Festival ideas and other generators use this to suggest content that fits your niche. Only you can see it.
          </p>
        </div>
      </div>

      {missing ? (
        <p className="text-sm text-warn">Run the SQL file 20261127120000_channel_profile.sql in Supabase to save these details.</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Channel name">
          <TextInput value={form.channel_name} onChange={(event) => patch({ channel_name: event.target.value })} maxLength={80} placeholder="Anu's Kitchen" />
        </Field>
        <Field label="Niche" hint="What most of your videos are about.">
          <TextInput value={form.niche} onChange={(event) => patch({ niche: event.target.value })} maxLength={80} placeholder="Kerala home cooking" />
        </Field>
        <Field label="Who watches" hint="Your typical viewer.">
          <TextInput value={form.audience} onChange={(event) => patch({ audience: event.target.value })} maxLength={160} placeholder="Malayali families, students living abroad" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Language">
            <SelectInput value={form.language} onChange={(event) => patch({ language: event.target.value as ChannelProfile["language"] })}>
              <option value="en">English</option>
              <option value="ml">Malayalam</option>
              <option value="both">Both</option>
            </SelectInput>
          </Field>
          <Field label="Platform">
            <SelectInput value={form.platform} onChange={(event) => patch({ platform: event.target.value as ChannelProfile["platform"] })}>
              <option value="both">Both</option>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
            </SelectInput>
          </Field>
        </div>
      </div>

      <div className="grid gap-2">
        <span className="text-sm font-medium">Style (up to 3)</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Channel style">
          {channelStyles.map((style) => {
            const on = form.styles.includes(style);
            return (
              <button key={style} type="button" className={choiceClass(on)} aria-pressed={on} onClick={() => toggleStyle(style)}>
                {style}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="About the channel" hint={`${form.about.length}/${CHANNEL_ABOUT_MAX} · Your usual formats, what makes you different, and topics to avoid.`}>
        <TextArea
          value={form.about}
          onChange={(event) => patch({ about: event.target.value })}
          maxLength={CHANNEL_ABOUT_MAX}
          className="min-h-24"
          placeholder="Short recipe reels and 8–10 minute YouTube videos of traditional Kerala dishes, made simple for beginners. No meat recipes."
        />
      </Field>

      <div>
        <Button
          loading={saving}
          disabled={!configured || missing}
          onClick={async () => {
            setSaving(true);
            const result = await saveChannelProfile(form);
            setSaving(false);
            if (!result.ok) return toast.error(result.error);
            toast.success(result.message ?? "Saved");
            router.refresh();
          }}
        >
          Save channel details
        </Button>
      </div>
    </Card>
  );
}
