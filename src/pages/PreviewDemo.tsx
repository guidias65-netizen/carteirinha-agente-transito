import { CarteirinhaPreview } from "@/components/CarteirinhaPreview";
import { Layout } from "@/components/Layout";

const DEMO_AGENT = {
  id: "demo",
  nome: "EDINEI TADEI BUENO DE CAMARGO",
  matricula: "2887",
  funcional: "012",
  cpf: "167.349.768-31",
  dataNascimento: "15/03/1985",
  tipoSanguineo: "O+",
  nacionalidade: "Brasileira",
  naturalidadeUf: "Sorocaba/SP",
  dataExpedicao: "01/12/2025",
  validade: "31/12/2030",
  equipamentoTipo: "PISTOLA",
  equipamentoMarca: "CONDOR",
  equipamentoNrSerie: "AAG20250104",
  foto: "",
};

export default function PreviewDemo() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-8">
        <h2 className="text-2xl font-bold text-primary mb-8 text-center">
          Pré-visualização — Modelo de Demonstração
        </h2>
        <CarteirinhaPreview agent={DEMO_AGENT} />
      </div>
    </Layout>
  );
}
