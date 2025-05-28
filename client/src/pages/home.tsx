import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import BalanceCard from "@/components/wallet/balance-card";
import ProgressCard from "@/components/education/progress-card";
import TransactionList from "@/components/transactions/transaction-list";
import PaymentModal from "@/components/payments/payment-modal";
import LessonModal from "@/components/education/lesson-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { 
  FileText, 
  Smartphone, 
  Globe, 
  GraduationCap,
  Laptop,
  Store,
  BarChart3,
  Headphones
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);

  const { data: wallet } = useQuery({
    queryKey: ["/api/wallet"],
  });

  const { data: educationProgress } = useQuery({
    queryKey: ["/api/education/progress"],
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-md mx-auto pb-20">
        {/* Balance Card */}
        <div className="p-4">
          <BalanceCard wallet={wallet} />
        </div>

        {/* Quick Actions */}
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-4 gap-4">
            <Button 
              variant="ghost" 
              className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center space-y-2 h-auto"
              onClick={() => setShowPaymentModal(true)}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs text-center text-slate-600">Contas</span>
            </Button>

            <Button 
              variant="ghost" 
              className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center space-y-2 h-auto"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-xs text-center text-slate-600">Recarga</span>
            </Button>

            <Button 
              variant="ghost" 
              className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center space-y-2 h-auto"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-xs text-center text-slate-600">Internacional</span>
            </Button>

            <Button 
              variant="ghost" 
              className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center space-y-2 h-auto"
              onClick={() => setShowLessonModal(true)}
            >
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-xs text-center text-slate-600">Aprender</span>
            </Button>
          </div>
        </div>

        {/* Educational Progress */}
        <div className="px-4 mb-6">
          <ProgressCard 
            educationProgress={educationProgress} 
            onContinueLesson={() => setShowLessonModal(true)}
          />
        </div>

        {/* Recent Transactions */}
        <div className="px-4 mb-6">
          <TransactionList transactions={transactions?.slice(0, 5) || []} />
        </div>

        {/* Services Section */}
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Serviços</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <Laptop className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-medium text-slate-900 mb-1 text-center">Freelancer</h3>
                <p className="text-xs text-slate-600 text-center">Receba pagamentos internacionais</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <Store className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-medium text-slate-900 mb-1 text-center">Marketplace</h3>
                <p className="text-xs text-slate-600 text-center">Venda produtos digitais</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <BarChart3 className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="font-medium text-slate-900 mb-1 text-center">Relatórios</h3>
                <p className="text-xs text-slate-600 text-center">Controle suas finanças</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <Headphones className="h-6 w-6 text-rose-600" />
                </div>
                <h3 className="font-medium text-slate-900 mb-1 text-center">Suporte</h3>
                <p className="text-xs text-slate-600 text-center">Ajuda e atendimento</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <BottomNavigation />
      
      {showPaymentModal && (
        <PaymentModal onClose={() => setShowPaymentModal(false)} />
      )}
      
      {showLessonModal && (
        <LessonModal onClose={() => setShowLessonModal(false)} />
      )}
    </div>
  );
}
