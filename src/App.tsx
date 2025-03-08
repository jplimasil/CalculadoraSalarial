import React, { useState, useEffect } from 'react';
import { Calculator, Moon, Sun, Download, RefreshCw, DollarSign, Percent, GraduationCap, BookOpen, PenTool, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format, getDaysInMonth, startOfMonth, endOfMonth, differenceInWeeks, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DayHours {
  day: string;
  hours: number;
}

type DiscountType = 'fixed' | 'percentage';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [hourlyRate, setHourlyRate] = useState<number>(50);
  const [workDays, setWorkDays] = useState<DayHours[]>([
    { day: 'Segunda', hours: 0 },
    { day: 'Terça', hours: 0 },
    { day: 'Quarta', hours: 0 },
    { day: 'Quinta', hours: 0 },
    { day: 'Sexta', hours: 0 },
    { day: 'Sábado', hours: 0 },
  ]);
  const [darkMode, setDarkMode] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>('fixed');
  const [discounts, setDiscounts] = useState<number>(0);
  const [benefits, setBenefits] = useState<number>(0);
  const [overtimeHours, setOvertimeHours] = useState<number>(0);

  const daysInMonth = getDaysInMonth(currentDate);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthName = format(currentDate, 'MMMM', { locale: ptBR });
  
  // Calcular dias úteis do mês (seg-sex)
  const calculateBusinessDays = () => {
    let count = 0;
    let day = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    while (day.getMonth() === currentDate.getMonth()) {
      const dayOfWeek = day.getDay();
      // 0 = Domingo, 6 = Sábado
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      day.setDate(day.getDate() + 1);
    }
    
    return count;
  };
  
  const businessDays = calculateBusinessDays();
  
  // Calcular o número exato de semanas no mês
  const exactWeeks = daysInMonth / 7;
  const fullWeeks = Math.floor(exactWeeks);
  const remainingDays = daysInMonth % 7;
  
  // Formatar a exibição de semanas para o usuário
  const weeksDisplay = remainingDays > 0 
    ? `${fullWeeks} semanas e ${remainingDays} dias` 
    : `${fullWeeks} semanas`;
  
  // Para cálculos, usar o valor exato de semanas (incluindo frações)
  const weeksForCalculation = exactWeeks;
  const totalHours = workDays.reduce((acc, day) => acc + day.hours, 0);
  const weeklyGross = totalHours * hourlyRate;
  const monthlyGross = weeklyGross * weeksForCalculation;
  const overtimeAmount = overtimeHours * hourlyRate;
  const calculatedDiscounts = discountType === 'percentage' 
    ? ((monthlyGross + overtimeAmount) * discounts) / 100 
    : discounts;
  const finalMonthly = monthlyGross + overtimeAmount - calculatedDiscounts + benefits;

  const handleHoursChange = (index: number, hours: number) => {
    const newWorkDays = [...workDays];
    newWorkDays[index].hours = hours;
    setWorkDays(newWorkDays);
  };

  const resetForm = () => {
    setHourlyRate(50);
    setWorkDays(workDays.map(day => ({ ...day, hours: 0 })));
    setDiscounts(0);
    setBenefits(0);
    setOvertimeHours(0);
  };

  const handleMonthChange = (date: Date) => {
    setCurrentDate(date);
    setShowCalendar(false);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Relatório Salarial do Professor', pageWidth / 2, 20, { align: 'center' });
    
    // Add date
    doc.setFontSize(12);
    doc.text(`Data: ${format(currentDate, 'dd/MM/yyyy')}`, 20, 30);
    
    // Add month information
    doc.text(`Mês: ${monthName} - ${daysInMonth} dias (${weeksDisplay})`, 20, 40);
    
    // Add basic information
    doc.setFontSize(14);
    doc.text('Informações Básicas', 20, 55);
    doc.setFontSize(12);
    doc.text(`Valor da Hora/Aula: R$ ${hourlyRate.toFixed(2)}`, 20, 65);
    
    // Add hours per day
    doc.text('Horas por Dia:', 20, 80);
    let yPos = 90;
    workDays.forEach((day) => {
      doc.text(`${day.day}: ${day.hours} horas`, 30, yPos);
      yPos += 10;
    });
    
    // Add overtime
    yPos += 10;
    doc.text(`Horas Extras: ${overtimeHours} horas (R$ ${overtimeAmount.toFixed(2)})`, 20, yPos);
    
    // Add calculations
    yPos += 10;
    doc.setFontSize(14);
    doc.text('Resumo dos Cálculos', 20, yPos);
    doc.setFontSize(12);
    
    yPos += 10;
    doc.text(`Total de Horas Semanais: ${totalHours} horas`, 20, yPos);
    
    yPos += 10;
    doc.text(`Salário Semanal: R$ ${weeklyGross.toFixed(2)}`, 20, yPos);
    
    yPos += 10;
    doc.text(`Salário Mensal Bruto: R$ ${monthlyGross.toFixed(2)}`, 20, yPos);
    
    yPos += 15;
    doc.text('Ajustes:', 20, yPos);
    yPos += 10;
    doc.text(
      `Descontos: ${discountType === 'percentage' ? `${discounts}% (R$ ${calculatedDiscounts.toFixed(2)})` : `R$ ${discounts.toFixed(2)}`}`, 
      30, 
      yPos
    );
    yPos += 10;
    doc.text(`Benefícios: R$ ${benefits.toFixed(2)}`, 30, yPos);
    
    yPos += 15;
    doc.setFontSize(16);
    doc.text(`Salário Mensal Final: R$ ${finalMonthly.toFixed(2)}`, 20, yPos);
    
    // Add footer
    doc.setFontSize(10);
    doc.text('Calculadora Salarial para Professores', pageWidth / 2, 280, { align: 'center' });
    
    // Save the PDF
    doc.save('relatorio-salarial.pdf');
  };

  // Adicionar verificação de PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then((registration) => {
            console.log('ServiceWorker registrado com sucesso:', registration);
          })
          .catch((error) => {
            console.log('Falha ao registrar ServiceWorker:', error);
          });
      });
    }
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${darkMode ? 'from-gray-900 to-gray-800 text-white' : 'from-blue-50 to-indigo-50 text-gray-900'}`}>
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>
      <div className="container mx-auto px-4 py-8 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Calculadora Salarial
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Para Professores e Educadores
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className={`p-3 rounded-full transition-colors ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-white hover:bg-gray-100'
              } shadow-lg relative`}
            >
              <CalendarIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-full transition-colors ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-white hover:bg-gray-100'
              } shadow-lg`}
            >
              {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Calendar Dropdown */}
        {showCalendar && (
          <div className={`absolute right-4 top-24 z-10 p-4 rounded-xl shadow-xl ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-center font-medium text-sm">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }, (_, i) => {
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1 - new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay());
                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <button
                    key={i}
                    onClick={() => handleMonthChange(date)}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm
                      ${isCurrentMonth ? '' : 'opacity-30'}
                      ${isToday ? 'bg-blue-600 text-white' : ''}
                      ${!isToday && isCurrentMonth ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Month Info */}
        <div className={`mb-8 p-4 rounded-xl ${
          darkMode ? 'bg-gray-800/50' : 'bg-white/50'
        } backdrop-blur-sm shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold capitalize">{monthName}</h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {daysInMonth} dias • {weeksDisplay}
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {businessDays} dias úteis
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">Período:</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {format(monthStart, 'dd/MM')} - {format(monthEnd, 'dd/MM/yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className={`p-6 rounded-2xl shadow-lg ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Informações Básicas</h2>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Valor da Hora/Aula (R$)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600" />
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-white text-gray-900 border-gray-200'
                  }`}
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <PenTool className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-medium">Horas por Dia</h3>
              </div>
              <div className="space-y-4">
                {workDays.map((day, index) => (
                  <div key={day.day} className="flex items-center gap-4">
                    <label className="w-24 font-medium">{day.day}</label>
                    <input
                      type="number"
                      value={day.hours}
                      onChange={(e) => handleHoursChange(index, Number(e.target.value))}
                      className={`w-24 px-3 py-2 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        darkMode 
                          ? 'bg-gray-700 text-white border-gray-600' 
                          : 'bg-white text-gray-900 border-gray-200'
                      }`}
                    />
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>horas</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-medium">Horas Extras Mensais</h3>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-white text-gray-900 border-gray-200'
                  }`}
                  placeholder="Quantidade de horas extras"
                />
                {overtimeHours > 0 && (
                  <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Valor das horas extras: R$ {overtimeAmount.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Descontos
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2 p-1 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <button
                      onClick={() => setDiscountType('fixed')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        discountType === 'fixed'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      Valor Fixo
                    </button>
                    <button
                      onClick={() => setDiscountType('percentage')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        discountType === 'percentage'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Percent className="w-4 h-4" />
                      Porcentagem
                    </button>
                  </div>
                  <div className="relative">
                    {discountType === 'percentage' ? (
                      <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600" />
                    ) : (
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600" />
                    )}
                    <input
                      type="number"
                      value={discounts}
                      onChange={(e) => setDiscounts(Number(e.target.value))}
                      className={`w-full py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        darkMode 
                          ? 'bg-gray-700 text-white border-gray-600' 
                          : 'bg-white text-gray-900 border-gray-200'
                      } ${discountType === 'percentage' ? 'pr-10' : 'pl-10'}`}
                      placeholder={discountType === 'percentage' ? 'Porcentagem' : 'Valor em R$'}
                    />
                  </div>
                  {discountType === 'percentage' && discounts > 0 && (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Valor calculado: R$ {calculatedDiscounts.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Benefícios (R$)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600" />
                  <input
                    type="number"
                    value={benefits}
                    onChange={(e) => setBenefits(Number(e.target.value))}
                    className={`w-full pl-10 py-3 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-white text-gray-900 border-gray-200'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className={`p-6 rounded-2xl shadow-lg ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
          }`}>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <Calculator className="w-6 h-6 text-blue-600" />
              Resumo dos Cálculos
            </h2>
            
            <div className="space-y-6">
              <div className={`p-6 rounded-xl ${
                darkMode ? 'bg-blue-900/50' : 'bg-blue-50'
              } border-2 border-blue-200 dark:border-blue-800`}>
                <h3 className="text-lg font-medium mb-2">Informações do Mês</h3>
                <p className="font-medium">
                  {daysInMonth} dias totais • {businessDays} dias úteis
                </p>
                <p className="text-sm mt-1 text-blue-600 dark:text-blue-400">
                  {format(monthStart, 'dd/MM')} - {format(monthEnd, 'dd/MM/yyyy')}
                </p>
              </div>

              <div className={`p-6 rounded-xl ${
                darkMode ? 'bg-blue-900/50' : 'bg-blue-50'
              } border-2 border-blue-200 dark:border-blue-800`}>
                <h3 className="text-lg font-medium mb-2">Horas Semanais</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {totalHours} horas
                </p>
              </div>

              <div className={`p-6 rounded-xl ${
                darkMode ? 'bg-green-900/50' : 'bg-green-50'
              } border-2 border-green-200 dark:border-green-800`}>
                <h3 className="text-lg font-medium mb-2">Salário Semanal</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  R$ {weeklyGross.toFixed(2)}
                </p>
              </div>

              <div className={`p-6 rounded-xl ${
                darkMode ? 'bg-purple-900/50' : 'bg-purple-50'
              } border-2 border-purple-200 dark:border-purple-800`}>
                <h3 className="text-lg font-medium mb-2">Salário Mensal</h3>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  R$ {monthlyGross.toFixed(2)}
                </p>
                {overtimeHours > 0 && (
                  <p className={`text-sm mt-2 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    + R$ {overtimeAmount.toFixed(2)} (horas extras)
                  </p>
                )}
              </div>

              <div className={`p-6 rounded-xl ${
                darkMode ? 'bg-indigo-900/50' : 'bg-indigo-50'
              } border-2 border-indigo-200 dark:border-indigo-800`}>
                <h3 className="text-lg font-medium mb-2">Salário Final</h3>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  R$ {finalMonthly.toFixed(2)}
                </p>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  (Incluindo horas extras, descontos e benefícios)
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={downloadPDF}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                Baixar PDF
              </button>
              <button
                onClick={resetForm}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-colors shadow-lg hover:shadow-xl ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <RefreshCw className="w-5 h-5" />
                Resetar
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Desenvolvido com ❤️ para auxiliar professores no controle financeiro
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;