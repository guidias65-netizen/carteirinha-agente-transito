import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Agent } from "@/hooks/use-agents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const TIPOS_SANGUINEOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const agentSchema = z.object({
  nome: z.string().min(3, "Nome muito curto"),
  matricula: z.string().min(1, "Obrigatório"),
  funcional: z.string().optional(),
  cpf: z.string().min(14, "CPF inválido").max(14, "CPF inválido"),
  dataNascimento: z.string().min(10, "Data inválida"),
  tipoSanguineo: z.enum(TIPOS_SANGUINEOS, { errorMap: () => ({ message: "Selecione o tipo sanguíneo" }) }),
  nacionalidade: z.string().min(1, "Obrigatório"),
  naturalidadeUf: z.string().min(2, "Obrigatório"),
  dataExpedicao: z.string().min(10, "Data inválida"),
  validade: z.string().min(1, "Obrigatório"),
  equipamentoTipo: z.string().optional(),
  equipamentoMarca: z.string().optional(),
  equipamentoNrSerie: z.string().optional(),
});

type AgentFormValues = z.infer<typeof agentSchema>;

interface AgentFormProps {
  initialData?: Agent;
  suggestedFuncional?: string;
  onSubmit: (data: Omit<Agent, "id" | "criadoEm">) => void | Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

/** Aplica máscara dd/mm/aaaa enquanto o usuário digita */
function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Recebe dd/mm/aaaa e retorna dd/mm/aaaa com +5 anos, ou "" se inválido */
function addFiveYears(dateStr: string): string {
  const parts = dateStr.split("/");
  if (parts.length !== 3 || parts[2].length !== 4) return "";
  const [dd, mm, yyyy] = parts;
  const year = parseInt(yyyy, 10);
  if (isNaN(year)) return "";
  return `${dd}/${mm}/${year + 5}`;
}

export function AgentForm({ initialData, suggestedFuncional, onSubmit, onCancel, saving = false }: AgentFormProps) {
  const [fotoBase64, setFotoBase64] = useState<string>(initialData?.foto || "");

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      nome: initialData?.nome || "",
      matricula: initialData?.matricula || "",
      funcional: initialData?.funcional || suggestedFuncional || "",
      cpf: initialData?.cpf || "",
      dataNascimento: initialData?.dataNascimento || "",
      tipoSanguineo: (initialData?.tipoSanguineo as typeof TIPOS_SANGUINEOS[number]) || undefined,
      nacionalidade: initialData?.nacionalidade || "Brasileira",
      naturalidadeUf: initialData?.naturalidadeUf || "Sorocaba/SP",
      dataExpedicao: initialData?.dataExpedicao || new Date().toLocaleDateString("pt-BR"),
      validade: initialData?.validade || addFiveYears(
        initialData?.dataExpedicao || new Date().toLocaleDateString("pt-BR")
      ),
      equipamentoTipo: initialData?.equipamentoTipo || "PISTOLA",
      equipamentoMarca: initialData?.equipamentoMarca || "CONDOR",
      equipamentoNrSerie: initialData?.equipamentoNrSerie || "",
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_W = 600;
        const MAX_H = 800;
        let { width, height } = img;
        const ratio = Math.min(MAX_W / width, MAX_H / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        setFotoBase64(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (values: AgentFormValues) => {
    onSubmit({
      ...values,
      funcional: values.funcional || "",
      foto: fotoBase64,
      fotoPendente: initialData?.fotoPendente ?? "",
      equipamentoTipo: values.equipamentoTipo || "",
      equipamentoMarca: values.equipamentoMarca || "",
      equipamentoNrSerie: values.equipamentoNrSerie || "",
    });
  };

  return (
    <Card className="shadow-md border-primary/10">
      <CardHeader className="bg-muted/50 border-b">
        <CardTitle className="text-xl text-primary">
          {initialData ? "Editar Agente" : "Novo Agente de Trânsito"}
        </CardTitle>
        <CardDescription>
          Preencha os dados oficiais para a geração da funcional.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">

            {/* Foto + dados principais */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-40 bg-muted rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden relative group">
                  {fotoBase64 ? (
                    <img src={fotoBase64} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem foto</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Label htmlFor="foto-upload" className="text-white text-xs cursor-pointer px-2 py-1 bg-primary rounded">
                      Trocar
                    </Label>
                  </div>
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="foto-upload" className="sr-only">Foto (Upload)</Label>
                  <Input id="foto-upload" type="file" accept="image/*"
                    onChange={handlePhotoChange} className="text-xs" />
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <FormField control={form.control} name="nome"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: JOÃO DA SILVA" {...field}
                          className="uppercase"
                          onChange={e => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="matricula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matrícula</FormLabel>
                      <FormControl>
                        <Input placeholder="00000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="funcional"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº Funcional</FormLabel>
                      <FormControl>
                        <Input placeholder="000" {...field} inputMode="numeric" />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {initialData
                          ? "Editável — use para corrigir o número se necessário."
                          : "Gerado automaticamente. Altere se necessário."}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          value={field.value}
                          onChange={e => field.onChange(maskCPF(e.target.value))}
                          inputMode="numeric"
                          maxLength={14}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* DATA DE NASCIMENTO — máscara dd/mm/aaaa */}
                <FormField control={form.control} name="dataNascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="DD/MM/AAAA"
                          value={field.value}
                          onChange={e => field.onChange(maskDate(e.target.value))}
                          inputMode="numeric"
                          maxLength={10}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TIPO SANGUÍNEO — select */}
                <FormField control={form.control} name="tipoSanguineo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Sanguíneo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPOS_SANGUINEOS.map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="nacionalidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nacionalidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Brasileira" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="naturalidadeUf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naturalidade/UF</FormLabel>
                      <FormControl>
                        <Input placeholder="Sorocaba/SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="text-sm font-semibold text-primary col-span-1 md:col-span-2">
                Validade do Documento
              </h3>

              {/* DATA DE EXPEDIÇÃO — máscara dd/mm/aaaa, auto-calcula validade */}
              <FormField control={form.control} name="dataExpedicao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Expedição</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="DD/MM/AAAA"
                        value={field.value}
                        onChange={e => {
                          const masked = maskDate(e.target.value);
                          field.onChange(masked);
                          // auto-fill validade = expedição + 5 anos
                          const v = addFiveYears(masked);
                          if (v) form.setValue("validade", v);
                        }}
                        inputMode="numeric"
                        maxLength={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* VALIDADE — preenchida automaticamente, mas editável */}
              <FormField control={form.control} name="validade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validade</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Preenchida automaticamente"
                        value={field.value}
                        onChange={e => field.onChange(maskDate(e.target.value))}
                        inputMode="numeric"
                        maxLength={10}
                        className="bg-muted/40"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Calculada automaticamente como 5 anos após a expedição.
                    </p>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <h3 className="text-sm font-semibold text-primary col-span-1 md:col-span-3">
                Equipamento de Defesa Pessoal (Opcional)
              </h3>

              <FormField control={form.control} name="equipamentoTipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Input placeholder="PISTOLA" {...field} className="uppercase"
                        onChange={e => field.onChange(e.target.value.toUpperCase())} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="equipamentoMarca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input placeholder="TAURUS" {...field} className="uppercase"
                        onChange={e => field.onChange(e.target.value.toUpperCase())} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="equipamentoNrSerie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº de Série</FormLabel>
                    <FormControl>
                      <Input placeholder="XYZ123" {...field} className="uppercase"
                        onChange={e => field.onChange(e.target.value.toUpperCase())} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground" disabled={saving}>
                {saving ? "Salvando..." : "Salvar Agente"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
