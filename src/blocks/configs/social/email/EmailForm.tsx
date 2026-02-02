"use client";

import { useRef } from "react";
import { LuSend } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { TemplateFieldSelector } from "@/blocks/configs/shared/TemplateFieldSelector";
import { IoMdArrowDropdown } from "react-icons/io";
import { IoInformationCircle } from "react-icons/io5";

interface EmailFormProps {
  emailTo: string;
  emailSubject: string;
  emailBody: string;
  loading: boolean;
  currentNodeId: string;
  onEmailToChange: (value: string) => void;
  onEmailSubjectChange: (value: string) => void;
  onEmailBodyChange: (value: string) => void;
  onSendTest: () => Promise<void>;
}

export function EmailForm({
  emailTo,
  emailSubject,
  emailBody,
  loading,
  currentNodeId,
  onEmailToChange,
  onEmailSubjectChange,
  onEmailBodyChange,
  onSendTest,
}: EmailFormProps) {
  const subjectRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const insertIntoField = (
    field: "subject" | "body",
    placeholder: string
  ) => {
    const ref = field === "subject" ? subjectRef : bodyRef;
    const currentValue = field === "subject" ? emailSubject : emailBody;
    const onChange = field === "subject" ? onEmailSubjectChange : onEmailBodyChange;

    if (ref.current) {
      const input = ref.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue =
        currentValue.substring(0, start) +
        placeholder +
        currentValue.substring(end);
      onChange(newValue);
      setTimeout(() => {
        input.focus();
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          input.setSelectionRange(start + placeholder.length, start + placeholder.length);
        }
      }, 0);
    } else {
      onChange(currentValue + placeholder);
    }
  };

  return (
    <div className="space-y-4">
      {/* Template Field Selector */}
      <TemplateFieldSelector
        currentNodeId={currentNodeId}
        onInsertField={(placeholder) => {
          // Default to body if no specific field is focused
          insertIntoField("body", placeholder);
        }}
      />

      {/* Recipient Email */}
      <FormInput
        label="Recipient Email"
        type="email"
        value={emailTo}
        onChange={(e) => onEmailToChange(e.target.value)}
        placeholder="recipient@example.com"
        disabled={loading}
        required
      />

      {/* Subject */}
      <FormInput
        ref={subjectRef}
        label="Subject"
        type="text"
        value={emailSubject}
        onChange={(e) => onEmailSubjectChange(e.target.value)}
        placeholder="Email subject"
        disabled={loading}
        required
      />

      {/* Body */}
      <div className="space-y-2">
        <FormInput
          ref={bodyRef}
          label="Message Body"
          as="textarea"
          textareaProps={{
            value: emailBody,
            onChange: (e) => onEmailBodyChange(e.target.value),
            placeholder: "Enter your email message here...",
            disabled: loading,
            rows: 6,
            className: "resize-none",
          }}
          required
        />
      </div>

      {/* Test Email Section */}
      <details className="group border border-white/10 rounded-lg overflow-hidden transition-all duration-200">
        <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors select-none text-sm text-gray-400 font-medium">
          <span>Test Email Configuration</span>
          <span className="transform group-open:rotate-180 transition-transform duration-200">
            <IoMdArrowDropdown className="w-4 h-4" />
          </span>
        </summary>

        <div className="p-4 space-y-4 border-t border-white/10 bg-white/5">
          <div className="flex items-start gap-3 text-sm text-gray-400">
            <IoInformationCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="leading-snug">Dynamic content may not be replaced in test emails.</span>
          </div>

          <Button
            onClick={onSendTest}
            disabled={loading || !emailTo || !emailSubject || !emailBody}
            className="w-full h-auto py-2.5"
          >
            {loading ? (
              <>Sending Test...</>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <LuSend className="w-4 h-4 shrink-0" />
                <span>Send Test Email</span>
              </div>
            )}
          </Button>
        </div>
      </details>
    </div>
  );
}
