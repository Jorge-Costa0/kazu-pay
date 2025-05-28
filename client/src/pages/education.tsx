import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  GraduationCap,
  Shield,
  TrendingUp,
  Award,
  Target,
  BookOpen,
  CheckCircle,
  Lock,
  Flame,
  Star
} from "lucide-react";

const lessons = [
  {
    id: 1,
    title: "Detectar Golpes",
    description: "Aprenda a identificar tentativas de fraude",
    category: "Segurança Digital",
    xp: 50,
    difficulty: "Iniciante",
    icon: Shield,
    color: "red",
    unlocked: true
  },
  {
    id: 2,
    title: "Senhas Seguras",
    description: "Como criar e gerenciar senhas fortes",
    category: "Segurança Digital",
    xp: 75,
    difficulty: "Iniciante",
    icon: Lock,
    color: "blue",
    unlocked: true
  },
  {
    id: 3,
    title: "Orçamento Pessoal",
    description: "Controle seus gastos e planeje suas finanças",
    category: "Finanças Pessoais",
    xp: 100,
    difficulty: "Intermediário",
    icon: TrendingUp,
    color: "green",
    unlocked: false
  },
  {
    id: 4,
    title: "Investimentos Básicos",
    description: "Primeiros passos no mundo dos investimentos",
    category: "Finanças Pessoais",
    xp: 150,
    difficulty: "Intermediário",
    icon: Target,
    color: "purple",
    unlocked: false
  },
  {
    id: 5,
    title: "Marketing Digital",
    description: "Promova seus produtos e serviços online",
    category: "Empreendedorismo",
    xp: 200,
    difficulty: "Avançado",
    icon: Star,
    color: "amber",
    unlocked: false
  }
];

const achievements = [
  {
    id: 1,
    title: "Primeiro Passo",
    description: "Complete sua primeira lição",
    icon: Award,
    unlocked: true
  },
  {
    id: 2,
    title: "Estudioso",
    description: "Complete 5 lições",
    icon: BookOpen,
    unlocked: false
  },
  {
    id: 3,
    title: "Expert em Segurança",
    description: "Complete todas as lições de segurança",
    icon: Shield,
    unlocked: false
  }
];

export default function Education() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: educationProgress } = useQuery({
    queryKey: ["/api/education/progress"],
  });

  const completeLessonMutation = useMutation({
    mutationFn: (data: { lessonId: number; xpGained: number }) => 
      apiRequest("POST", "/api/education/complete-lesson", data),
    onSuccess: (_, variables) => {
      toast({
        title: "Lição concluída!",
        description: `Você ganhou ${variables.xpGained} XP. Continue aprendendo!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/education/progress"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao completar a lição",
        variant: "destructive",
      });
    },
  });

  const categories = ["all", "Segurança Digital", "Finanças Pessoais", "Empreendedorismo"];

  const filteredLessons = selectedCategory === "all" 
    ? lessons 
    : lessons.filter(lesson => lesson.category === selectedCategory);

  const progress = educationProgress || { level: 1, xp: 0, streak: 0, completedLessons: [] };
  const xpToNextLevel = (progress.level * 1000) - progress.xp;
  const levelProgress = (progress.xp % 1000) / 10; // Progress percentage for current level

  const handleCompleteLesson = (lesson: any) => {
    if (!lesson.unlocked) return;
    
    completeLessonMutation.mutate({
      lessonId: lesson.id,
      xpGained: lesson.xp
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Iniciante": return "bg-green-100 text-green-800";
      case "Intermediário": return "bg-yellow-100 text-yellow-800";
      case "Avançado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "red": return "text-red-600 bg-red-100";
      case "blue": return "text-blue-600 bg-blue-100";
      case "green": return "text-green-600 bg-green-100";
      case "purple": return "text-purple-600 bg-purple-100";
      case "amber": return "text-amber-600 bg-amber-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-md mx-auto pb-20">
        {/* Progress Overview */}
        <div className="p-4">
          <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Educação Financeira</h2>
                <div className="flex items-center space-x-1">
                  <Flame className="h-5 w-5 text-orange-300" />
                  <span className="text-sm font-medium">{progress.streak}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 border-4 border-white/30 rounded-full flex items-center justify-center relative">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold">{progress.level}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/80 mb-1">Nível {progress.level}</p>
                  <Progress value={levelProgress} className="h-2 mb-2" />
                  <p className="text-xs text-white/70">{xpToNextLevel} XP para próximo nível</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{progress.xp}</p>
                  <p className="text-xs text-white/80">XP Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{progress.completedLessons?.length || 0}</p>
                  <p className="text-xs text-white/80">Lições</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="px-4 mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category === "all" ? "Todas" : category}
              </Button>
            ))}
          </div>
        </div>

        {/* Lessons */}
        <div className="px-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Lições Disponíveis</h2>
          <div className="space-y-3">
            {filteredLessons.map((lesson) => {
              const Icon = lesson.icon;
              const isCompleted = progress.completedLessons?.includes(lesson.id);
              
              return (
                <Card 
                  key={lesson.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !lesson.unlocked ? "opacity-50" : ""
                  } ${isCompleted ? "border-green-200 bg-green-50" : ""}`}
                  onClick={() => handleCompleteLesson(lesson)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getIconColor(lesson.color)}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{lesson.title}</h3>
                          {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {!lesson.unlocked && <Lock className="h-4 w-4 text-gray-400" />}
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{lesson.description}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className={getDifficultyColor(lesson.difficulty)}>
                            {lesson.difficulty}
                          </Badge>
                          <Badge variant="outline">
                            +{lesson.xp} XP
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div className="px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Conquistas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div 
                      key={achievement.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        achievement.unlocked ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        achievement.unlocked ? "bg-yellow-100" : "bg-gray-100"
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          achievement.unlocked ? "text-yellow-600" : "text-gray-400"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          achievement.unlocked ? "text-slate-900" : "text-gray-500"
                        }`}>
                          {achievement.title}
                        </h3>
                        <p className={`text-sm ${
                          achievement.unlocked ? "text-slate-600" : "text-gray-400"
                        }`}>
                          {achievement.description}
                        </p>
                      </div>
                      {achievement.unlocked && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
