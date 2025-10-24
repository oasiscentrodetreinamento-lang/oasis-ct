'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import jsPDF from 'jspdf';
import { FileText, User, Calendar, Activity, Eye, Download, Trash2, Plus } from 'lucide-react';

interface AvaliacaoData {
  id: string;
  nome: string;
  dataNascimento: string;
  genero: 'masculino' | 'feminino';
  dataAvaliacao: string;
  estatura: number;
  massaCorporal: number;
  imc: number;
  percentGordura: number;
  percentMassaMagra: number;
  mmiTentativa1: number;
  mmiTentativa2: number;
  preensaoDireita1: number;
  preensaoDireita2: number;
  preensaoEsquerda1: number;
  preensaoEsquerda2: number;
  marcha6min: number;
  katzPontos: number;
  lawtonPontos: number;
  tugSegundos: number;
  observacoes: string;
}

// Funções de classificação
const getImcClassificacao = (imc: number) => {
  if (imc < 18.5) return { classificacao: 'Baixo peso', cor: 'red' };
  if (imc < 25) return { classificacao: 'Peso normal', cor: 'green' };
  if (imc < 30) return { classificacao: 'Sobrepeso', cor: 'red' };
  return { classificacao: 'Obesidade', cor: 'red' };
};

const getMmiClassificacao = (tempo: number, idade: number | null) => {
  if (!idade) return { classificacao: 'Indefinido', cor: 'gray' };
  if (idade < 60) {
    if (tempo < 12) return { classificacao: 'Excelente', cor: 'green' };
    if (tempo < 15) return { classificacao: 'Bom', cor: 'green' };
    if (tempo < 18) return { classificacao: 'Regular', cor: 'red' };
    return { classificacao: 'Fraco', cor: 'red' };
  } else {
    if (tempo < 14) return { classificacao: 'Excelente', cor: 'green' };
    if (tempo < 17) return { classificacao: 'Bom', cor: 'green' };
    if (tempo < 21) return { classificacao: 'Regular', cor: 'red' };
    return { classificacao: 'Fraco', cor: 'red' };
  }
};

const getPreensaoClassificacao = (forca: number, mao: 'direita' | 'esquerda') => {
  if (forca >= 30) return { classificacao: 'Excelente', cor: 'green' };
  if (forca >= 20) return { classificacao: 'Bom', cor: 'green' };
  if (forca >= 10) return { classificacao: 'Regular', cor: 'red' };
  return { classificacao: 'Fraco', cor: 'red' };
};

const getMarchaClassificacao = (passos: number) => {
  if (passos >= 400) return { classificacao: 'Excelente', cor: 'green' };
  if (passos >= 300) return { classificacao: 'Bom', cor: 'green' };
  if (passos >= 200) return { classificacao: 'Regular', cor: 'red' };
  return { classificacao: 'Fraco', cor: 'red' };
};

const getKatzClassificacao = (pontos: number) => {
  if (pontos === 6) return { classificacao: 'Independente', cor: 'green' };
  if (pontos >= 4) return { classificacao: 'Dependência leve', cor: 'red' };
  if (pontos >= 2) return { classificacao: 'Dependência moderada', cor: 'red' };
  return { classificacao: 'Dependência severa', cor: 'red' };
};

const getLawtonClassificacao = (pontos: number) => {
  if (pontos >= 24) return { classificacao: 'Independente', cor: 'green' };
  if (pontos >= 18) return { classificacao: 'Dependência leve', cor: 'red' };
  if (pontos >= 12) return { classificacao: 'Dependência moderada', cor: 'red' };
  return { classificacao: 'Dependência severa', cor: 'red' };
};

const getTugClassificacao = (segundos: number) => {
  if (segundos < 12) return { classificacao: 'Baixo risco', cor: 'green' };
  if (segundos < 21) return { classificacao: 'Risco médio', cor: 'red' };
  return { classificacao: 'Alto risco', cor: 'red' };
};

export default function Home() {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<AvaliacaoData>();
  const [idade, setIdade] = useState<number | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoData[]>([]);
  const [activeTab, setActiveTab] = useState<'nova' | 'salvas'>('nova');
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<AvaliacaoData | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const dataNascimento = watch('dataNascimento');
  const estatura = watch('estatura');
  const massaCorporal = watch('massaCorporal');

  useEffect(() => {
    if (dataNascimento) {
      const nascimento = new Date(dataNascimento);
      const hoje = new Date();
      const idadeCalc = hoje.getFullYear() - nascimento.getFullYear() -
        (hoje.getMonth() < nascimento.getMonth() || (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate()) ? 1 : 0);
      setIdade(idadeCalc);
    } else {
      setIdade(null);
    }
  }, [dataNascimento]);

  useEffect(() => {
    if (estatura && massaCorporal) {
      const imc = massaCorporal / ((estatura / 100) ** 2);
      setValue('imc', parseFloat(imc.toFixed(2)));
    }
  }, [estatura, massaCorporal, setValue]);

  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0];
    setValue('dataAvaliacao', hoje);
  }, [setValue]);

  useEffect(() => {
    const saved = localStorage.getItem('avaliacoes');
    if (saved) {
      setAvaliacoes(JSON.parse(saved));
    }
  }, []);

  const generatePDF = async (data: AvaliacaoData) => {
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFillColor(255, 193, 7); // Amarelo
      pdf.rect(0, 0, pageWidth, 30, 'F');
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OÁSIS CT - SISTEMA DE AVALIAÇÃO FÍSICO FUNCIONAL', pageWidth / 2, 15, { align: 'center' });
      pdf.text('RELATÓRIO DE AVALIAÇÃO', pageWidth / 2, 25, { align: 'center' });

      yPosition = 45;

      // Dados do Paciente
      pdf.setFillColor(240, 240, 240);
      pdf.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DADOS DO PACIENTE', 15, yPosition);
      yPosition += 15;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Nome: ${data.nome}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Data de Nascimento: ${new Date(data.dataNascimento).toLocaleDateString('pt-BR')}`, 15, yPosition);
      const idadeCalculada = new Date().getFullYear() - new Date(data.dataNascimento).getFullYear();
      pdf.text(`Idade: ${idadeCalculada} anos`, 120, yPosition);
      yPosition += 6;
      pdf.text(`Gênero: ${data.genero.charAt(0).toUpperCase() + data.genero.slice(1)}`, 15, yPosition);
      pdf.text(`Data da Avaliação: ${new Date(data.dataAvaliacao).toLocaleDateString('pt-BR')}`, 120, yPosition);
      yPosition += 15;

      // Antropometria
      pdf.setFillColor(240, 240, 240);
      pdf.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text('ANTROPOMETRIA', 15, yPosition);
      yPosition += 15;

      pdf.setFont('helvetica', 'normal');
      const imcClass = getImcClassificacao(data.imc);
      pdf.text(`Estatura: ${data.estatura} cm`, 15, yPosition);
      pdf.text(`Massa Corporal: ${data.massaCorporal} kg`, 80, yPosition);
      yPosition += 6;
      pdf.text(`IMC: ${data.imc} kg/m²`, 15, yPosition);
      pdf.setTextColor(imcClass.cor === 'green' ? 0 : 255, imcClass.cor === 'green' ? 128 : 0, 0);
      pdf.text(`(${imcClass.classificacao})`, 60, yPosition);
      pdf.setTextColor(0, 0, 0);
      yPosition += 6;
      pdf.text(`% Gordura: ${data.percentGordura}%`, 15, yPosition);
      pdf.text(`% Massa Magra: ${data.percentMassaMagra}%`, 80, yPosition);
      yPosition += 15;

      // Testes Funcionais
      pdf.setFillColor(240, 240, 240);
      pdf.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text('TESTES FUNCIONAIS', 15, yPosition);
      yPosition += 15;

      pdf.setFont('helvetica', 'normal');
      
      // MMI
      pdf.setFont('helvetica', 'bold');
      pdf.text('Força de Membros Inferiores (MMI):', 15, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      const mmi1Class = getMmiClassificacao(data.mmiTentativa1, idade);
      const mmi2Class = getMmiClassificacao(data.mmiTentativa2, idade);
      pdf.text(`1ª Tentativa: ${data.mmiTentativa1}s`, 15, yPosition);
      pdf.setTextColor(mmi1Class.cor === 'green' ? 0 : 255, mmi1Class.cor === 'green' ? 128 : 0, 0);
      pdf.text(`(${mmi1Class.classificacao})`, 60, yPosition);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`2ª Tentativa: ${data.mmiTentativa2}s`, 120, yPosition);
      pdf.setTextColor(mmi2Class.cor === 'green' ? 0 : 255, mmi2Class.cor === 'green' ? 128 : 0, 0);
      pdf.text(`(${mmi2Class.classificacao})`, 165, yPosition);
      pdf.setTextColor(0, 0, 0);
      yPosition += 12;

      // Preensão Palmar
      pdf.setFont('helvetica', 'bold');
      pdf.text('Força de Preensão Palmar:', 15, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      const pd1Class = getPreensaoClassificacao(data.preensaoDireita1, 'direita');
      const pd2Class = getPreensaoClassificacao(data.preensaoDireita2, 'direita');
      const pe1Class = getPreensaoClassificacao(data.preensaoEsquerda1, 'esquerda');
      const pe2Class = getPreensaoClassificacao(data.preensaoEsquerda2, 'esquerda');
      
      pdf.text(`Mão Direita - 1ª: ${data.preensaoDireita1}kg`, 15, yPosition);
      pdf.setTextColor(pd1Class.cor === 'green' ? 0 : 255, pd1Class.cor === 'green' ? 128 : 0, 0);
      pdf.text(`(${pd1Class.classificacao})`, 70, yPosition);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`2ª: ${data.preensaoDireita2}kg`, 120, yPosition);
      pdf.setTextColor(pd2Class.cor === 'green' ? 0 : 255, pd2Class.cor === 'green' ? 128 : 0, 0);
      pdf.text(`(${pd2Class.classificacao})`, 150, yPosition);
      pdf.setTextColor(0, 0, 0);
      yPosition += 6;
      
      pdf.text(`Mão Esquerda - 1ª: ${data.preensaoEsquerda1}kg`, 15, yPosition);
      pdf.setTextColor(pe1Class.cor === 'green' ? 0 : 255, pe1Class.cor === 'green' ? 128 : 0, 0);
      pdf.text(`(${pe1Class.classificacao})`, 70, yPosition);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`2ª: ${data.preensaoEsquerda2}kg`, 120, yPosition);
      pdf.setTextColor(pe2Class.cor === 'green' ? 0 : 255, pe2Class.cor === 'green' ? 128 : 0, 0);
      pdf.text(`(${pe2Class.classificacao})`, 150, yPosition);
      pdf.setTextColor(0, 0, 0);
      yPosition += 12;

      // Capacidade Aeróbia
      pdf.setFont('helvetica', 'bold');
      pdf.text('Capacidade Aeróbia (Marcha 6 min):', 15, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      const marchaClass = getMarchaClassificacao(data.marcha6min);
      pdf.text(`Passos: ${data.marcha6min}`, 15, yPosition);
      pdf.setTextColor(marchaClass.cor === 'green' ? 0 : 255, marchaClass.cor === 'green' ? 128 : 0, 0);
      pdf.text(`(${marchaClass.classificacao})`, 60, yPosition);
      pdf.setTextColor(0, 0, 0);
      yPosition += 12;

      // Escalas
      pdf.setFont('helvetica', 'bold');
      pdf.text('Escalas de Funcionalidade:', 15, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      const katzClass = getKatzClassificacao(data.katzPontos);
      const lawtonClass = getLawtonClassificacao(data.lawtonPontos);
      pdf.text(`KATZ: ${data.katzPontos} pontos`, 15, yPosition);
      pdf.setTextColor(katzClass.cor === 'green' ? 0 : 255, katzClass.cor === 'green' ? 128 : 0, 0);
      pdf.text(`(${katzClass.classificacao})`, 60, yPosition);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`LAWTON: ${data.lawtonPontos} pontos`, 120, yPosition);
      pdf.setTextColor(lawtonClass.cor === 'green' ? 0 : 255, lawtonClass.cor === 'green' ? 128 : 0, 0);
      pdf.text(`(${lawtonClass.classificacao})`, 170, yPosition);
      pdf.setTextColor(0, 0, 0);
      yPosition += 12;

      // TUG
      pdf.setFont('helvetica', 'bold');
      pdf.text('Teste TUG (Mobilidade e Equilíbrio):', 15, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');
      const tugClass = getTugClassificacao(data.tugSegundos);
      pdf.text(`Tempo: ${data.tugSegundos}s`, 15, yPosition);
      pdf.setTextColor(tugClass.cor === 'green' ? 0 : 255, tugClass.cor === 'green' ? 128 : 0, 0);
      pdf.text(`(${tugClass.classificacao})`, 60, yPosition);
      pdf.setTextColor(0, 0, 0);
      yPosition += 15;

      // Observações
      if (data.observacoes) {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.text('OBSERVAÇÕES DO PROFISSIONAL', 15, yPosition);
        yPosition += 15;
        
        pdf.setFont('helvetica', 'normal');
        const splitObservacoes = pdf.splitTextToSize(data.observacoes, pageWidth - 30);
        pdf.text(splitObservacoes, 15, yPosition);
        yPosition += splitObservacoes.length * 6;
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      pdf.save(`avaliacao_${data.nome}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const onSubmit = (data: AvaliacaoData) => {
    const novaAvaliacao = {
      ...data,
      id: Date.now().toString()
    };
    
    const novasAvaliacoes = [...avaliacoes, novaAvaliacao];
    setAvaliacoes(novasAvaliacoes);
    localStorage.setItem('avaliacoes', JSON.stringify(novasAvaliacoes));
    
    generatePDF(novaAvaliacao);
    reset();
    setIdade(null);
  };

  const gerarPDFSalva = (avaliacao: AvaliacaoData) => {
    generatePDF(avaliacao);
  };

  const excluirAvaliacao = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
      const novasAvaliacoes = avaliacoes.filter(a => a.id !== id);
      setAvaliacoes(novasAvaliacoes);
      localStorage.setItem('avaliacoes', JSON.stringify(novasAvaliacoes));
    }
  };

  const visualizarAvaliacao = (avaliacao: AvaliacaoData) => {
    setAvaliacaoSelecionada(avaliacao);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Activity className="h-10 w-10 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-800">OÁSIS CT</h1>
          </div>
          <p className="text-xl text-gray-600">Sistema de Avaliação Físico-Funcional</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('nova')}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'nova'
                ? 'bg-yellow-500 text-black shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-yellow-500'
            }`}
          >
            <Plus className="inline h-5 w-5 mr-2" />
            Nova Avaliação
          </button>
          <button
            onClick={() => setActiveTab('salvas')}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'salvas'
                ? 'bg-yellow-500 text-black shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-yellow-500'
            }`}
          >
            <FileText className="inline h-5 w-5 mr-2" />
            Avaliações Salvas ({avaliacoes.length})
          </button>
        </div>

        {/* Nova Avaliação Tab */}
        {activeTab === 'nova' && (
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Dados Pessoais */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Dados Pessoais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nome Completo</label>
                    <input 
                      type="text" 
                      {...register('nome', { required: 'Campo obrigatório' })} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      placeholder="Ex: João Silva"
                    />
                    {errors.nome && <span className="text-red-500 text-sm mt-1 block">{errors.nome.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Data de Nascimento</label>
                    <input 
                      type="date" 
                      {...register('dataNascimento', { required: 'Campo obrigatório' })} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    />
                    {errors.dataNascimento && <span className="text-red-500 text-sm mt-1 block">{errors.dataNascimento.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gênero</label>
                    <select 
                      {...register('genero', { required: 'Campo obrigatório' })} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    >
                      <option value="">Selecione...</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                    </select>
                    {errors.genero && <span className="text-red-500 text-sm mt-1 block">{errors.genero.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Idade Calculada</label>
                    <input 
                      type="text" 
                      disabled 
                      value={idade !== null ? `${idade} anos` : 'Preencha a data de nascimento'}
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Antropometria */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Antropometria</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Estatura (cm)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      {...register('estatura', { required: 'Campo obrigatório', valueAsNumber: true })} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      placeholder="Ex: 170"
                    />
                    {errors.estatura && <span className="text-red-500 text-sm mt-1 block">{errors.estatura.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Massa Corporal (kg)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      {...register('massaCorporal', { required: 'Campo obrigatório', valueAsNumber: true })} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      placeholder="Ex: 70"
                    />
                    {errors.massaCorporal && <span className="text-red-500 text-sm mt-1 block">{errors.massaCorporal.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">IMC (Calculado)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      disabled 
                      {...register('imc', { valueAsNumber: true })} 
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                    {watch('imc') && (
                      <div className={`mt-2 p-2 rounded-lg text-sm font-medium ${
                        getImcClassificacao(watch('imc')).cor === 'green' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {getImcClassificacao(watch('imc')).classificacao}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Data da Avaliação</label>
                    <input 
                      type="date" 
                      {...register('dataAvaliacao', { required: 'Campo obrigatório' })} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    />
                    {errors.dataAvaliacao && <span className="text-red-500 text-sm mt-1 block">{errors.dataAvaliacao.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">% Gordura</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      {...register('percentGordura', { required: 'Campo obrigatório', valueAsNumber: true })} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      placeholder="Ex: 15.5"
                    />
                    {errors.percentGordura && <span className="text-red-500 text-sm mt-1 block">{errors.percentGordura.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">% Massa Magra</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      {...register('percentMassaMagra', { required: 'Campo obrigatório', valueAsNumber: true })} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      placeholder="Ex: 84.5"
                    />
                    {errors.percentMassaMagra && <span className="text-red-500 text-sm mt-1 block">{errors.percentMassaMagra.message}</span>}
                  </div>
                </div>
              </div>

              {/* Teste de Força MMI */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Teste de Força de Membros Inferiores (MMI)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">1ª Tentativa (segundos)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      {...register('mmiTentativa1', { required: 'Campo obrigatório', valueAsNumber: true })} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      placeholder="Ex: 10.5"
                    />
                    {watch('mmiTentativa1') && (
                      <div className={`mt-2 p-2 rounded-lg text-sm font-medium ${
                        getMmiClassificacao(watch('mmiTentativa1'), idade).cor === 'green' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {getMmiClassificacao(watch('mmiTentativa1'), idade).classificacao}
                      </div>
                    )}
                    {errors.mmiTentativa1 && <span className="text-red-500 text-sm mt-1 block">{errors.mmiTentativa1.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">2ª Tentativa (segundos)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      {...register('mmiTentativa2', { required: 'Campo obrigatório', valueAsNumber: true })} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      placeholder="Ex: 11.2"
                    />
                    {watch('mmiTentativa2') && (
                      <div className={`mt-2 p-2 rounded-lg text-sm font-medium ${
                        getMmiClassificacao(watch('mmiTentativa2'), idade).cor === 'green' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {getMmiClassificacao(watch('mmiTentativa2'), idade).classificacao}
                      </div>
                    )}
                    {errors.mmiTentativa2 && <span className="text-red-500 text-sm mt-1 block">{errors.mmiTentativa2.message}</span>}
                  </div>
                </div>
              </div>

              {/* Teste de Força Preensão Palmar */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Teste de Força Preensão Palmar</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Mão Direita</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">1ª Tentativa (kg)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          {...register('preensaoDireita1', { required: 'Campo obrigatório', valueAsNumber: true })} 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                          placeholder="Ex: 25.5"
                        />
                        {watch('preensaoDireita1') && (
                          <div className={`mt-2 p-2 rounded-lg text-sm font-medium ${
                            getPreensaoClassificacao(watch('preensaoDireita1'), 'direita').cor === 'green' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {getPreensaoClassificacao(watch('preensaoDireita1'), 'direita').classificacao}
                          </div>
                        )}
                        {errors.preensaoDireita1 && <span className="text-red-500 text-sm mt-1 block">{errors.preensaoDireita1.message}</span>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">2ª Tentativa (kg)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          {...register('preensaoDireita2', { required: 'Campo obrigatório', valueAsNumber: true })} 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                          placeholder="Ex: 26.0"
                        />
                        {watch('preensaoDireita2') && (
                          <div className={`mt-2 p-2 rounded-lg text-sm font-medium ${
                            getPreensaoClassificacao(watch('preensaoDireita2'), 'direita').cor === 'green' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {getPreensaoClassificacao(watch('preensaoDireita2'), 'direita').classificacao}
                          </div>
                        )}
                        {errors.preensaoDireita2 && <span className="text-red-500 text-sm mt-1 block">{errors.preensaoDireita2.message}</span>}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Mão Esquerda</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">1ª Tentativa (kg)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          {...register('preensaoEsquerda1', { required: 'Campo obrigatório', valueAsNumber: true })} 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                          placeholder="Ex: 23.5"
                        />
                        {watch('preensaoEsquerda1') && (
                          <div className={`mt-2 p-2 rounded-lg text-sm font-medium ${
                            getPreensaoClassificacao(watch('preensaoEsquerda1'), 'esquerda').cor === 'green' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {getPreensaoClassificacao(watch('preensaoEsquerda1'), 'esquerda').classificacao}
                          </div>
                        )}
                        {errors.preensaoEsquerda1 && <span className="text-red-500 text-sm mt-1 block">{errors.preensaoEsquerda1.message}</span>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">2ª Tentativa (kg)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          {...register('preensaoEsquerda2', { required: 'Campo obrigatório', valueAsNumber: true })} 
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                          placeholder="Ex: 24.0"
                        />
                        {watch('preensaoEsquerda2') && (
                          <div className={`mt-2 p-2 rounded-lg text-sm font-medium ${
                            getPreensaoClassificacao(watch('preensaoEsquerda2'), 'esquerda').cor === 'green' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {getPreensaoClassificacao(watch('preensaoEsquerda2'), 'esquerda').classificacao}
                          </div>
                        )}
                        {errors.preensaoEsquerda2 && <span className="text-red-500 text-sm mt-1 block">{errors.preensaoEsquerda2.message}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Capacidade Aeróbia */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Capacidade Aeróbia - Teste de Marcha de 6 Minutos</h2>
                <div className="max-w-md">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Passos</label>
                  <input 
                    type="number" 
                    {...register('marcha6min', { required: 'Campo obrigatório', valueAsNumber: true })} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    placeholder="Ex: 450"
                  />
                  {watch('marcha6min') && (
                    <div className={`mt-2 p-2 rounded-lg text-sm font-medium ${
                      getMarchaClassificacao(watch('marcha6min')).cor === 'green' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {getMarchaClassificacao(watch('marcha6min')).classificacao}
                    </div>
                  )}
                  {errors.marcha6min && <span className="text-red-500 text-sm mt-1 block">{errors.marcha6min.message}</span>}
                </div>
              </div>

              {/* Escalas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Escala KATZ */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Escala KATZ</h2>
                  <p className="text-gray-600 mb-4">Atividades Básicas da Vida Diária</p>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pontos (0-6)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="6" 
                      {...register('katzPontos', { required: 'Campo obrigatório', valueAsNumber: true })} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      placeholder="Ex: 5"
                    />
                    {watch('katzPontos') !== undefined && (
                      <div className={`mt-2 p-2 rounded-lg text-sm font-medium ${
                        getKatzClassificacao(watch('katzPontos')).cor === 'green' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {getKatzClassificacao(watch('katzPontos')).classificacao}
                      </div>
                    )}
                    {errors.katzPontos && <span className="text-red-500 text-sm mt-1 block">{errors.katzPontos.message}</span>}
                  </div>
                </div>

                {/* Escala Lawton */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Escala Lawton</h2>
                  <p className="text-gray-600 mb-4">Atividades Instrumentais da Vida Diária</p>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Pontos (0-27)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="27" 
                      {...register('lawtonPontos', { required: 'Campo obrigatório', valueAsNumber: true })} 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                      placeholder="Ex: 22"
                    />
                    {watch('lawtonPontos') !== undefined && (
                      <div className={`mt-2 p-2 rounded-lg text-sm font-medium ${
                        getLawtonClassificacao(watch('lawtonPontos')).cor === 'green' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {getLawtonClassificacao(watch('lawtonPontos')).classificacao}
                      </div>
                    )}
                    {errors.lawtonPontos && <span className="text-red-500 text-sm mt-1 block">{errors.lawtonPontos.message}</span>}
                  </div>
                </div>
              </div>

              {/* Teste TUG */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Teste TUG (Timed Up and Go)</h2>
                <p className="text-gray-600 mb-4">Avaliação de Mobilidade e Equilíbrio</p>
                <div className="max-w-md">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tempo (segundos)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    {...register('tugSegundos', { required: 'Campo obrigatório', valueAsNumber: true })} 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    placeholder="Ex: 10.5"
                  />
                  {watch('tugSegundos') && (
                    <div className={`mt-2 p-2 rounded-lg text-sm font-medium ${
                      getTugClassificacao(watch('tugSegundos')).cor === 'green' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {getTugClassificacao(watch('tugSegundos')).classificacao}
                    </div>
                  )}
                  {errors.tugSegundos && <span className="text-red-500 text-sm mt-1 block">{errors.tugSegundos.message}</span>}
                </div>
              </div>

              {/* Observações */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Observações do Profissional</h2>
                <textarea 
                  {...register('observacoes')} 
                  className="w-full p-4 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all resize-none"
                  placeholder="Digite seu parecer profissional, recomendações e observações relevantes sobre a avaliação..."
                />
              </div>

              {/* Botão de Submissão */}
              <div className="flex justify-center">
                <button 
                  type="submit" 
                  disabled={isGeneratingPDF}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black px-12 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      <span>Gerando Relatório...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      <span>Gerar Relatório PDF</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'salvas' && (
          <div className="max-w-6xl mx-auto">
            {avaliacoes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhuma avaliação salva</h3>
                <p className="text-gray-500">Realize sua primeira avaliação para visualizar os resultados aqui.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {avaliacoes.map((avaliacao) => (
                  <div key={avaliacao.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{avaliacao.nome}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(avaliacao.dataAvaliacao).toLocaleDateString('pt-BR')}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{avaliacao.genero.charAt(0).toUpperCase() + avaliacao.genero.slice(1)}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => visualizarAvaliacao(avaliacao)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Visualizar</span>
                        </button>
                        <button
                          onClick={() => gerarPDFSalva(avaliacao)}
                          className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          <span>PDF</span>
                        </button>
                        <button
                          onClick={() => excluirAvaliacao(avaliacao.id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">IMC:</span>
                        <div className={`inline-block ml-2 px-2 py-1 rounded text-xs ${
                          getImcClassificacao(avaliacao.imc).cor === 'green' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {avaliacao.imc} - {getImcClassificacao(avaliacao.imc).classificacao}
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">KATZ:</span>
                        <div className={`inline-block ml-2 px-2 py-1 rounded text-xs ${
                          getKatzClassificacao(avaliacao.katzPontos).cor === 'green' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {avaliacao.katzPontos} pts
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">LAWTON:</span>
                        <div className={`inline-block ml-2 px-2 py-1 rounded text-xs ${
                          getLawtonClassificacao(avaliacao.lawtonPontos).cor === 'green' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {avaliacao.lawtonPontos} pts
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">TUG:</span>
                        <div className={`inline-block ml-2 px-2 py-1 rounded text-xs ${
                          getTugClassificacao(avaliacao.tugSegundos).cor === 'green' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {avaliacao.tugSegundos}s
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal de Visualização */}
        {avaliacaoSelecionada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Detalhes da Avaliação</h2>
                  <button
                    onClick={() => setAvaliacaoSelecionada(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Dados do Paciente */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Dados do Paciente</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Nome:</strong> {avaliacaoSelecionada.nome}</div>
                    <div><strong>Data de Nascimento:</strong> {new Date(avaliacaoSelecionada.dataNascimento).toLocaleDateString('pt-BR')}</div>
                    <div><strong>Gênero:</strong> {avaliacaoSelecionada.genero.charAt(0).toUpperCase() + avaliacaoSelecionada.genero.slice(1)}</div>
                    <div><strong>Data da Avaliação:</strong> {new Date(avaliacaoSelecionada.dataAvaliacao).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>

                {/* Antropometria */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Antropometria</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><strong>Estatura:</strong> {avaliacaoSelecionada.estatura} cm</div>
                    <div><strong>Massa Corporal:</strong> {avaliacaoSelecionada.massaCorporal} kg</div>
                    <div>
                      <strong>IMC:</strong> {avaliacaoSelecionada.imc} kg/m²
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        getImcClassificacao(avaliacaoSelecionada.imc).cor === 'green' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getImcClassificacao(avaliacaoSelecionada.imc).classificacao}
                      </span>
                    </div>
                    <div><strong>% Gordura:</strong> {avaliacaoSelecionada.percentGordura}%</div>
                    <div><strong>% Massa Magra:</strong> {avaliacaoSelecionada.percentMassaMagra}%</div>
                  </div>
                </div>

                {/* Testes Funcionais */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Testes Funcionais</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <strong>MMI:</strong> 1ª: {avaliacaoSelecionada.mmiTentativa1}s, 2ª: {avaliacaoSelecionada.mmiTentativa2}s
                    </div>
                    <div>
                      <strong>Preensão Palmar:</strong> 
                      <br />Direita: {avaliacaoSelecionada.preensaoDireita1}kg / {avaliacaoSelecionada.preensaoDireita2}kg
                      <br />Esquerda: {avaliacaoSelecionada.preensaoEsquerda1}kg / {avaliacaoSelecionada.preensaoEsquerda2}kg
                    </div>
                    <div><strong>Marcha 6 min:</strong> {avaliacaoSelecionada.marcha6min} passos</div>
                    <div><strong>KATZ:</strong> {avaliacaoSelecionada.katzPontos} pontos</div>
                    <div><strong>LAWTON:</strong> {avaliacaoSelecionada.lawtonPontos} pontos</div>
                    <div><strong>TUG:</strong> {avaliacaoSelecionada.tugSegundos} segundos</div>
                  </div>
                </div>

                {/* Observações */}
                {avaliacaoSelecionada.observacoes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Observações</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {avaliacaoSelecionada.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

