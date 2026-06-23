import { tasksData } from '@/data/mock-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Clock, Calendar as CalendarIcon, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function Tarefas() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Tarefas</h1>
          <p className="text-gray-500 mt-1">Suas atividades e follow-ups agendados.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      <div className="space-y-3">
        {tasksData.map((task) => (
          <Card
            key={task.id}
            className={`transition-all hover:shadow-md ${task.status === 'Concluído' ? 'opacity-60 bg-gray-50' : 'bg-white'}`}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <button className="text-gray-300 hover:text-primary transition-colors flex-shrink-0">
                <CheckCircle2
                  className={`h-6 w-6 ${task.status === 'Concluído' ? 'text-green-500 fill-green-50' : ''}`}
                />
              </button>

              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold text-gray-900 truncate ${task.status === 'Concluído' ? 'line-through text-gray-500' : ''}`}
                >
                  {task.title}
                </h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    {task.dueDate === 'Hoje' ? (
                      <Clock className="h-3.5 w-3.5 text-orange-500" />
                    ) : (
                      <CalendarIcon className="h-3.5 w-3.5" />
                    )}
                    <span className={task.dueDate === 'Hoje' ? 'text-orange-600 font-medium' : ''}>
                      {task.dueDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {task.priority === 'Alta' && (
                  <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">
                    Urgente
                  </Badge>
                )}
                <Badge variant="outline" className="border-gray-200">
                  {task.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
