/**
 * Re-exports from route-level server actions.
 * Components import from here for shorter paths.
 */

export {
    initializeFromTemplate,
    createLevelingStructure as createStructure,
    updateLevelingStructure as updateStructure,
    deleteLevelingStructure as deleteStructure,
    setDefaultStructure,
    createLevelDefinition as createLevel,
    updateLevelDefinition as updateLevel,
    deleteLevelDefinition as deleteLevel,
    reorderLevels,
    saveLevelingStructureFromAssistant,
} from '@/app/(dashboard)/dashboard/job-architecture/actions'

export {
    createJobFamily as createFamily,
    updateJobFamily as updateFamily,
    deleteJobFamily as deleteFamily,
    initializeDefaultFamilies,
    createJob,
    updateJob,
    deleteJob,
    updateJobDescription,
} from '@/app/(dashboard)/dashboard/job-architecture/jobActions'

export {
    createCompetency,
    updateCompetency,
    deleteCompetency,
    initializeDefaultCompetencies,
    addGradeMapping,
    removeGradeMapping,
    deleteGradeMapping,
} from '@/app/(dashboard)/dashboard/job-architecture/competencyActions'

export {
    assignEmployeeToJob,
    unassignEmployee,
    bulkAssign,
    getEmployeesForDataset,
    getAssignmentsForJob,
} from '@/app/(dashboard)/dashboard/job-architecture/mappingActions'
