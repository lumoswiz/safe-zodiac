export var ExecutionMode;
(function (ExecutionMode) {
    ExecutionMode["SendTransactions"] = "legacy";
    ExecutionMode["SendCalls"] = "eip5792";
})(ExecutionMode || (ExecutionMode = {}));
export var SetupStage;
(function (SetupStage) {
    SetupStage[SetupStage["DeploySafe"] = 0] = "DeploySafe";
    SetupStage[SetupStage["DeployModule"] = 1] = "DeployModule";
    SetupStage[SetupStage["EnableModule"] = 2] = "EnableModule";
    SetupStage[SetupStage["AssignRoles"] = 3] = "AssignRoles";
    SetupStage[SetupStage["ScopeTarget"] = 4] = "ScopeTarget";
    SetupStage[SetupStage["ScopeFunctions"] = 5] = "ScopeFunctions";
    SetupStage[SetupStage["NothingToDo"] = 6] = "NothingToDo";
})(SetupStage || (SetupStage = {}));
