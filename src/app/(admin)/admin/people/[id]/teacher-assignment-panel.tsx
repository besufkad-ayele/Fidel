import {
  assignTeacherAction,
  unassignTeacherAction,
  setPrimaryTeacherAction,
} from '@/app/(admin)/admin/manage-actions'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/admin/status-badge'

type Assignment = {
  id: string
  teacher_id: string
  is_primary: boolean
  assigned_at: string
}

type Teacher = { id: string; full_name: string; email: string }

export function TeacherAssignmentPanel({
  studentId,
  assignments,
  teachers,
  nameMap,
}: {
  studentId: string
  assignments: Assignment[]
  teachers: Teacher[]
  nameMap: Map<string, string>
}) {
  const assignedIds = new Set(assignments.map((a) => a.teacher_id))
  const available = teachers.filter((t) => !assignedIds.has(t.id))

  return (
    <div className="space-y-4">
      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No teachers assigned. Student is self-paced until you assign a temari.
        </p>
      ) : (
        <ul className="space-y-2">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-cream-300 bg-cream-100 px-3 py-2 text-sm"
            >
              <span className="min-w-0 flex-1 font-medium">
                {nameMap.get(a.teacher_id) ?? a.teacher_id.slice(0, 8)}
              </span>
              {a.is_primary ? <StatusBadge status="primary" /> : null}
              {!a.is_primary ? (
                <form action={setPrimaryTeacherAction}>
                  <input type="hidden" name="assignmentId" value={a.id} />
                  <input type="hidden" name="studentId" value={studentId} />
                  <Button type="submit" size="sm" variant="ghost">
                    Make primary
                  </Button>
                </form>
              ) : null}
              <form action={unassignTeacherAction}>
                <input type="hidden" name="assignmentId" value={a.id} />
                <input type="hidden" name="studentId" value={studentId} />
                <Button type="submit" size="sm" variant="outline">
                  Remove
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 ? (
        <form action={assignTeacherAction} className="flex flex-wrap items-end gap-2 border-t border-cream-300 pt-4">
          <input type="hidden" name="studentId" value={studentId} />
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="teacherId">
              Assign temari
            </label>
            <select
              id="teacherId"
              name="teacherId"
              required
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Select teacher…
              </option>
              {available.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.email}
                </option>
              ))}
            </select>
          </div>
          <label className="flex h-9 items-center gap-2 text-sm">
            <input type="checkbox" name="makePrimary" className="size-4 rounded border-input" />
            Primary
          </label>
          <Button type="submit" size="sm">
            Assign
          </Button>
        </form>
      ) : teachers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Create a teacher account first.</p>
      ) : null}
    </div>
  )
}
