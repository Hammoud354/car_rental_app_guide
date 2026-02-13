import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Sparkles, Calendar, DollarSign, Clock, AlertTriangle, CheckCircle2, XCircle, Edit, Trash2, RefreshCw } from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AIMaintenance() {
  const utils = trpc.useUtils();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [overrideNotes, setOverrideNotes] = useState("");

  // Fetch vehicles
  const { data: vehicles } = trpc.fleet.list.useQuery();

  // Fetch all maintenance tasks
  const { data: allTasks } = trpc.aiMaintenance.getAllTasks.useQuery();

  // Fetch tasks for selected vehicle
  const { data: vehicleTasks } = trpc.aiMaintenance.getTasksByVehicle.useQuery(
    { vehicleId: selectedVehicleId! },
    { enabled: selectedVehicleId !== null }
  );

  // Generate AI schedule mutation
  const generateSchedule = trpc.aiMaintenance.generateSchedule.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated ${data.tasks.length} maintenance tasks!`, {
        description: data.summary,
      });
      utils.aiMaintenance.getAllTasks.invalidate();
      utils.aiMaintenance.getTasksByVehicle.invalidate();
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error("Failed to generate schedule", {
        description: error.message,
      });
      setIsGenerating(false);
    },
  });

  // Update task mutation
  const updateTask = trpc.aiMaintenance.updateTask.useMutation({
    onSuccess: () => {
      toast.success("Task updated successfully");
      utils.aiMaintenance.getAllTasks.invalidate();
      utils.aiMaintenance.getTasksByVehicle.invalidate();
      setIsEditDialogOpen(false);
      setSelectedTask(null);
    },
    onError: (error) => {
      toast.error("Failed to update task", {
        description: error.message,
      });
    },
  });

  // Complete task mutation
  const completeTask = trpc.aiMaintenance.completeTask.useMutation({
    onSuccess: () => {
      toast.success("Task marked as completed");
      utils.aiMaintenance.getAllTasks.invalidate();
      utils.aiMaintenance.getTasksByVehicle.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to complete task", {
        description: error.message,
      });
    },
  });

  // Delete task mutation
  const deleteTask = trpc.aiMaintenance.deleteTask.useMutation({
    onSuccess: () => {
      toast.success("Task deleted");
      utils.aiMaintenance.getAllTasks.invalidate();
      utils.aiMaintenance.getTasksByVehicle.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to delete task", {
        description: error.message,
      });
    },
  });

  const handleGenerateSchedule = (vehicleId: number) => {
    setIsGenerating(true);
    generateSchedule.mutate({ vehicleId });
  };

  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setOverrideNotes(task.overrideNotes || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveTaskEdit = () => {
    if (!selectedTask) return;

    updateTask.mutate({
      taskId: selectedTask.id,
      updates: {
        userOverridden: true,
        overrideNotes,
      },
    });
  };

  const handleCompleteTask = (taskId: number) => {
    completeTask.mutate({ taskId });
  };

  const handleDeleteTask = (taskId: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask.mutate({ taskId });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500 hover:bg-red-600";
      case "Important":
        return "bg-orange-500 hover:bg-orange-600";
      case "Recommended":
        return "bg-blue-500 hover:bg-blue-600";
      case "Optional":
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <AlertTriangle className="h-4 w-4" />;
      case "Important":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Skipped":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Dismissed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Group tasks by vehicle
  const tasksByVehicle = allTasks?.reduce((acc: any, task: any) => {
    if (!acc[task.vehicleId]) {
      acc[task.vehicleId] = [];
    }
    acc[task.vehicleId].push(task);
    return acc;
  }, {}) || {};

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              AI-Powered Maintenance
            </h1>
            <p className="text-muted-foreground mt-1">
              Intelligent maintenance scheduling with priority classification
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vehicles">By Vehicle</TabsTrigger>
            <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{allTasks?.length || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all vehicles
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {allTasks?.filter(t => t.status === "Pending").length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requires attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Critical Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {allTasks?.filter(t => t.priority === "Critical" && t.status === "Pending").length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Immediate action needed
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Vehicles with AI Maintenance */}
            <Card>
              <CardHeader>
                <CardTitle>Generate AI Maintenance Schedules</CardTitle>
                <CardDescription>
                  Click on a vehicle to generate an intelligent maintenance schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles?.map((vehicle: any) => {
                    const vehicleTaskCount = tasksByVehicle[vehicle.id]?.length || 0;
                    const hasTasks = vehicleTaskCount > 0;

                    return (
                      <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{vehicle.plateNumber}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {vehicle.brand} {vehicle.model}
                              </p>
                            </div>
                            {hasTasks && (
                              <Badge variant="secondary">{vehicleTaskCount} tasks</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>Year: {vehicle.year}</div>
                            <div>Mileage: {vehicle.mileage?.toLocaleString()} km</div>
                          </div>
                          <Button
                            onClick={() => handleGenerateSchedule(vehicle.id)}
                            disabled={isGenerating}
                            className="w-full"
                            size="sm"
                          >
                            {isGenerating ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                {hasTasks ? "Regenerate" : "Generate"} Schedule
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Vehicle Tab */}
          <TabsContent value="vehicles" className="space-y-6">
            {vehicles?.map((vehicle: any) => {
              const tasks = tasksByVehicle[vehicle.id] || [];
              if (tasks.length === 0) return null;

              return (
                <Card key={vehicle.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{vehicle.plateNumber} - {vehicle.brand} {vehicle.model}</CardTitle>
                        <CardDescription>
                          {vehicle.year} • {vehicle.mileage?.toLocaleString()} km
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{tasks.length} tasks</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tasks.map((task: any) => (
                        <Card key={task.id} className="border-l-4" style={{
                          borderLeftColor: task.priority === "Critical" ? "#ef4444" :
                                          task.priority === "Important" ? "#f97316" :
                                          task.priority === "Recommended" ? "#3b82f6" : "#6b7280"
                        }}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {getPriorityIcon(task.priority)}
                                    <span className="ml-1">{task.priority}</span>
                                  </Badge>
                                  <Badge variant="outline" className={getStatusColor(task.status)}>
                                    {task.status}
                                  </Badge>
                                  {task.category && (
                                    <Badge variant="outline">{task.category}</Badge>
                                  )}
                                </div>

                                <div>
                                  <h4 className="font-semibold">{task.taskName}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {task.description}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                  {task.estimatedCost && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      ${task.estimatedCost}
                                    </div>
                                  )}
                                  {task.estimatedDuration && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {task.estimatedDuration} min
                                    </div>
                                  )}
                                  {task.triggerMileage && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      @ {task.triggerMileage?.toLocaleString()} km
                                    </div>
                                  )}
                                </div>

                                {task.aiReasoning && (
                                  <div className="text-xs bg-muted p-2 rounded">
                                    <strong>AI Reasoning:</strong> {task.aiReasoning}
                                  </div>
                                )}

                                {task.userOverridden && task.overrideNotes && (
                                  <div className="text-xs bg-blue-50 border border-blue-200 p-2 rounded">
                                    <strong>Override Notes:</strong> {task.overrideNotes}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                {task.status === "Pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditTask(task)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCompleteTask(task.id)}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteTask(task.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* All Tasks Tab */}
          <TabsContent value="all-tasks" className="space-y-4">
            {allTasks && allTasks.length > 0 ? (
              allTasks.map((task: any) => {
                const vehicle = vehicles?.find((v: any) => v.id === task.vehicleId);
                
                return (
                  <Card key={task.id} className="border-l-4" style={{
                    borderLeftColor: task.priority === "Critical" ? "#ef4444" :
                                    task.priority === "Important" ? "#f97316" :
                                    task.priority === "Recommended" ? "#3b82f6" : "#6b7280"
                  }}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getPriorityColor(task.priority)}>
                              {getPriorityIcon(task.priority)}
                              <span className="ml-1">{task.priority}</span>
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                            {task.category && (
                              <Badge variant="outline">{task.category}</Badge>
                            )}
                            {vehicle && (
                              <Badge variant="secondary">
                                {vehicle.plateNumber} - {vehicle.brand} {vehicle.model}
                              </Badge>
                            )}
                          </div>

                          <div>
                            <h4 className="font-semibold">{task.taskName}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {task.estimatedCost && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${task.estimatedCost}
                              </div>
                            )}
                            {task.estimatedDuration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {task.estimatedDuration} min
                              </div>
                            )}
                            {task.triggerMileage && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                @ {task.triggerMileage?.toLocaleString()} km
                              </div>
                            )}
                          </div>

                          {task.aiReasoning && (
                            <div className="text-xs bg-muted p-2 rounded">
                              <strong>AI Reasoning:</strong> {task.aiReasoning}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {task.status === "Pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditTask(task)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCompleteTask(task.id)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Maintenance Tasks Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate AI-powered maintenance schedules for your vehicles to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Task Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Override Task</DialogTitle>
              <DialogDescription>
                Add your notes to customize this AI recommendation
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Task Name</Label>
                <Input value={selectedTask?.taskName || ""} disabled />
              </div>

              <div>
                <Label>Override Notes</Label>
                <Textarea
                  placeholder="Add your custom notes or modifications..."
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTaskEdit}>
                Save Override
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  );
}
