/**
 * Re-exports from route-level AI server actions.
 * Components import from here for shorter paths.
 */

export {
    generateJobDescriptionAction as generateJobDescription,
    generateCompetencyDescriptionAction as generateCompetencyDescription,
    generateCompetencyBehavioursAction as generateBehaviours,
    generateLevelingStructureAction as generateLevelingStructure,
} from '@/app/(dashboard)/dashboard/job-architecture/aiActions'

export {
    analyzeUploadedJD as analyzeJobDescription,
} from '@/app/(dashboard)/dashboard/job-architecture/jdUploadAction'
