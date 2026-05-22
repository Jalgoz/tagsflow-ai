import { useState } from 'react'
import {
  createEmptyMemberFormValues,
  createEmptyTagFormValues,
  createMemberInputFromFormValues,
  createTagInputFromFormValues,
  createMemberUseCases,
  createTagUseCases,
  memberToFormValues,
  tagToFormValues,
  type MemberFormInput,
  type MemberUsageSummary,
  type TagFormInput,
  type TagUsageSummary,
  updateMemberInputFromFormValues,
  updateTagInputFromFormValues,
  useCreateMember,
  useCreateTag,
  useDeleteMember,
  useDeleteTag,
  useMembers,
  useTags,
  useUpdateMember,
  useUpdateTag,
  useMemberManagementRepositories,
  useTagManagementRepositories,
} from '../../application'
import type { Member, Tag } from '../../domain'
import { MemberForm } from '../components/MemberForm'
import { TagBadge } from '../components/TagBadge'
import { TagForm } from '../components/TagForm'

type MemberEditorState =
  | {
      mode: 'create'
    }
  | {
      mode: 'edit'
      memberId: string
    }
  | null

type TagEditorState =
  | {
      mode: 'create'
    }
  | {
      mode: 'edit'
      tagId: string
    }
  | null

type MemberDeleteState = {
  member: Member
  usage: MemberUsageSummary
}

type TagDeleteState = {
  tag: Tag
  usage: TagUsageSummary
}

type MemberWorkspaceTab = 'members' | 'tags'

const formatDate = (value: string | null): string => {
  if (value === null || value.trim() === '') {
    return 'Not set'
  }

  return value
}

const formatUsageCount = (count: number, label: string): string | null => {
  if (count === 0) {
    return null
  }

  return `${count} ${label}${count === 1 ? '' : 's'}`
}

const formatMemberUsageSummary = (usage: MemberUsageSummary): string => {
  return [
    formatUsageCount(usage.projectCount, 'project'),
    formatUsageCount(usage.taskCount, 'task'),
    formatUsageCount(usage.subtaskCount, 'subtask'),
  ]
    .filter((value): value is string => value !== null)
    .join(', ')
}

const formatTagUsageSummary = (usage: TagUsageSummary): string => {
  return [formatUsageCount(usage.taskCount, 'task'), formatUsageCount(usage.subtaskCount, 'subtask')]
    .filter((value): value is string => value !== null)
    .join(', ')
}

const getInitials = (value: string): string => {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) {
    return '??'
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export const MembersPage = () => {
  const { data: members = [], error: membersError, isError: isMembersError, isLoading: isMembersLoading } = useMembers()
  const { data: tags = [], error: tagsError, isError: isTagsError, isLoading: isTagsLoading } = useTags()
  const createMember = useCreateMember()
  const updateMember = useUpdateMember()
  const deleteMember = useDeleteMember()
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()
  const memberRepositories = useMemberManagementRepositories()
  const tagRepositories = useTagManagementRepositories()
  const memberUseCases = createMemberUseCases(memberRepositories)
  const tagUseCases = createTagUseCases(tagRepositories)
  const [memberEditor, setMemberEditor] = useState<MemberEditorState>(null)
  const [tagEditor, setTagEditor] = useState<TagEditorState>(null)
  const [memberDeleteState, setMemberDeleteState] = useState<MemberDeleteState | null>(null)
  const [tagDeleteState, setTagDeleteState] = useState<TagDeleteState | null>(null)
  const [activeTab, setActiveTab] = useState<MemberWorkspaceTab>('members')

  const activeMember =
    memberEditor?.mode === 'edit' ? members.find((member) => member.id === memberEditor.memberId) ?? null : null
  const activeTag = tagEditor?.mode === 'edit' ? tags.find((tag) => tag.id === tagEditor.tagId) ?? null : null
  const visibleMembers =
    memberEditor?.mode === 'edit' && activeMember !== null ? members.filter((member) => member.id !== activeMember.id) : members
  const visibleTags =
    tagEditor?.mode === 'edit' && activeTag !== null ? tags.filter((tag) => tag.id !== activeTag.id) : tags

  const isMemberEditorVisible = memberEditor !== null && (memberEditor.mode === 'create' || activeMember !== null)
  const isTagEditorVisible = tagEditor !== null && (tagEditor.mode === 'create' || activeTag !== null)

  const memberInitialValues: MemberFormInput =
    memberEditor?.mode === 'edit' && activeMember !== null
      ? memberToFormValues(activeMember)
      : createEmptyMemberFormValues()

  const tagInitialValues: TagFormInput =
    tagEditor?.mode === 'edit' && activeTag !== null ? tagToFormValues(activeTag) : createEmptyTagFormValues()

  const openMemberEdit = (memberId: string) => {
    setTagEditor(null)
    setTagDeleteState(null)
    setMemberDeleteState(null)
    setMemberEditor({ mode: 'edit', memberId })
  }

  const openTagEdit = (tagId: string) => {
    setMemberEditor(null)
    setMemberDeleteState(null)
    setTagDeleteState(null)
    setTagEditor({ mode: 'edit', tagId })
  }

  const openMemberCatalog = () => {
    setActiveTab('members')
    setTagEditor(null)
    setTagDeleteState(null)
    setMemberEditor(null)
    setMemberDeleteState(null)
  }

  const openTagCatalog = () => {
    setActiveTab('tags')
    setMemberEditor(null)
    setMemberDeleteState(null)
    setTagEditor(null)
    setTagDeleteState(null)
  }

  const startMemberCreate = () => {
    setActiveTab('members')
    setTagEditor(null)
    setTagDeleteState(null)
    setMemberEditor({ mode: 'create' })
  }

  const startTagCreate = () => {
    setActiveTab('tags')
    setMemberEditor(null)
    setMemberDeleteState(null)
    setTagDeleteState(null)
    setTagEditor({ mode: 'create' })
  }

  const handleMemberDeleteRequest = async (member: Member) => {
    const usage = await memberUseCases.getMemberUsageSummary(member.id)
    setMemberEditor(null)
    setTagEditor(null)
    setTagDeleteState(null)
    setMemberDeleteState({ member, usage })
  }

  const handleTagDeleteRequest = async (tag: Tag) => {
    const usage = await tagUseCases.getTagUsageSummary(tag.id)
    setTagEditor(null)
    setMemberEditor(null)
    setMemberDeleteState(null)
    setTagDeleteState({ tag, usage })
  }

  const confirmMemberDelete = async () => {
    if (memberDeleteState === null) {
      return
    }

    await deleteMember.mutateAsync(memberDeleteState.member.id)
    setMemberDeleteState(null)
  }

  const confirmTagDelete = async () => {
    if (tagDeleteState === null) {
      return
    }

    await deleteTag.mutateAsync(tagDeleteState.tag.id)
    setTagDeleteState(null)
  }

  return (
    <section className="project-workspace member-workspace">
      <div className="project-workspace__header">
        <div>
          <p className="project-workspace__eyebrow">Members</p>
          <h2 className="project-workspace__title">Members and tags</h2>
          <p className="project-workspace__description">
            Maintain the local collaborator catalog and reusable tags that later workflows will assign to projects, tasks,
            and subtasks.
          </p>
        </div>
        <div className="member-workspace__header-actions">
          <button
            className="project-workspace__action"
            type="button"
            onClick={activeTab === 'members' ? startMemberCreate : startTagCreate}
          >
            {activeTab === 'members' ? 'New member' : 'New tag'}
          </button>
        </div>
      </div>

      <div className="member-workspace__tabs" role="tablist" aria-label="Members and tags sections">
        <button
          aria-controls="member-catalog-panel"
          aria-selected={activeTab === 'members'}
          className={`member-workspace__tab${activeTab === 'members' ? ' member-workspace__tab--active' : ''}`}
          id="member-catalog-tab"
              role="tab"
              type="button"
              onClick={openMemberCatalog}
        >
          Members
          <span>{members.length}</span>
        </button>
        <button
          aria-controls="tag-catalog-panel"
          aria-selected={activeTab === 'tags'}
          className={`member-workspace__tab${activeTab === 'tags' ? ' member-workspace__tab--active' : ''}`}
          id="tag-catalog-tab"
          role="tab"
          type="button"
          onClick={openTagCatalog}
        >
          Tags
          <span>{tags.length}</span>
        </button>
      </div>

      <div className="member-workspace__content">
        {activeTab === 'members' ? (
          <section
            aria-labelledby="member-catalog-tab"
            className="project-workspace__panel member-workspace__section"
            id="member-catalog-panel"
            role="tabpanel"
          >
            <div className="member-workspace__section-header">
              <div>
                <p className="project-workspace__eyebrow">Member catalog</p>
                <h3 className="project-workspace__section-title">Local collaborators</h3>
              </div>
            </div>

            {isMemberEditorVisible ? (
              <div className="project-workspace__panel member-workspace__inline-panel">
                <MemberForm
                  cancelLabel="Cancel"
                  description={
                    memberEditor.mode === 'create'
                      ? 'Create a local collaborator record.'
                      : 'Update the selected collaborator record.'
                  }
                  initialValues={memberInitialValues}
                  isSubmitting={createMember.isPending || updateMember.isPending}
                  onCancel={() => setMemberEditor(null)}
                  onSubmit={async (values) => {
                    if (memberEditor.mode === 'create') {
                      await createMember.mutateAsync(createMemberInputFromFormValues(values))
                      setMemberEditor(null)
                      return
                    }

                    await updateMember.mutateAsync({
                      memberId: memberEditor.memberId,
                      input: updateMemberInputFromFormValues(values),
                    })
                    setMemberEditor(null)
                  }}
                  submitLabel={memberEditor.mode === 'create' ? 'Create member' : 'Save changes'}
                  title={memberEditor.mode === 'create' ? 'Create member' : 'Edit member'}
                />
              </div>
            ) : null}

            {isMembersLoading ? <div className="project-state">Loading members...</div> : null}

            {isMembersError ? (
              <div className="project-state project-state--error">
                Unable to load members.
                <span>{membersError instanceof Error ? membersError.message : 'Unknown error'}</span>
              </div>
            ) : null}

            {!isMembersLoading && !isMembersError && members.length === 0 ? (
              <div className="project-empty-state member-workspace__empty-state">
                <div>
                  <p className="project-empty-state__eyebrow">No members yet</p>
                  <h3 className="project-empty-state__title">Create the first collaborator</h3>
                  <p className="project-empty-state__description">
                    Add local members now so they are ready for project assignment flows later.
                  </p>
                </div>
              </div>
            ) : null}

            {!isMembersLoading && !isMembersError && visibleMembers.length > 0 ? (
              <div className="project-list">
                {visibleMembers.map((member) => (
                  <article key={member.id} className="project-list__item member-workspace__item">
                    <div className="project-list__meta">
                      <div className="member-workspace__item-title-row">
                        <div className="member-workspace__item-identity">
                          <span className="member-workspace__avatar">{getInitials(member.avatar || member.name)}</span>
                          <div>
                            <h4 className="project-list__title">{member.name}</h4>
                            <p className="project-list__summary">{member.email || 'Email not set'}</p>
                          </div>
                        </div>
                        <span className="member-workspace__role">{member.role || 'No role'}</span>
                      </div>

                      <dl className="project-list__details member-workspace__details">
                        <div>
                          <dt>Avatar</dt>
                          <dd>{member.avatar || 'Not set'}</dd>
                        </div>
                        <div>
                          <dt>Role</dt>
                          <dd>{member.role || 'Not set'}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="project-list__actions">
                      <button
                        className="project-list__button"
                        type="button"
                        onClick={() => openMemberEdit(member.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="project-list__button project-list__button--danger"
                        type="button"
                        onClick={() => void handleMemberDeleteRequest(member)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {memberDeleteState !== null ? (
              <div className="project-detail__confirm project-detail__confirm--compact member-workspace__confirm">
                <strong>
                  {memberDeleteState.usage.isAssigned ? 'Delete assigned member?' : 'Delete this member?'}
                </strong>
                <p>
                  {memberDeleteState.usage.isAssigned
                    ? `This member is used in ${formatMemberUsageSummary(memberDeleteState.usage)}. Repository cleanup will unassign those references after confirmation.`
                    : 'This member is not assigned anywhere and can be deleted directly.'}
                </p>
                <div className="project-detail__confirm-actions">
                  <button
                    className="project-list__button project-list__button--secondary"
                    type="button"
                    onClick={() => setMemberDeleteState(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="project-list__button project-list__button--danger"
                    disabled={deleteMember.isPending}
                    type="button"
                    onClick={async () => {
                      await confirmMemberDelete()
                    }}
                  >
                    {deleteMember.isPending ? 'Deleting...' : 'Confirm delete'}
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === 'tags' ? (
          <section
            aria-labelledby="tag-catalog-tab"
            className="project-workspace__panel member-workspace__section"
            id="tag-catalog-panel"
            role="tabpanel"
          >
            <div className="member-workspace__section-header">
              <div>
                <p className="project-workspace__eyebrow">Tag catalog</p>
                <h3 className="project-workspace__section-title">Reusable tags</h3>
              </div>
            </div>

            {isTagEditorVisible ? (
              <div className="project-workspace__panel member-workspace__inline-panel">
                <TagForm
                  cancelLabel="Cancel"
                  description={tagEditor.mode === 'create' ? 'Create a reusable tag.' : 'Update the selected tag.'}
                  initialValues={tagInitialValues}
                  isSubmitting={createTag.isPending || updateTag.isPending}
                  onCancel={() => setTagEditor(null)}
                  onSubmit={async (values) => {
                    if (tagEditor.mode === 'create') {
                      await createTag.mutateAsync(createTagInputFromFormValues(values))
                      setTagEditor(null)
                      return
                    }

                    await updateTag.mutateAsync({
                      tagId: tagEditor.tagId,
                      input: updateTagInputFromFormValues(values),
                    })
                    setTagEditor(null)
                  }}
                  submitLabel={tagEditor.mode === 'create' ? 'Create tag' : 'Save changes'}
                  title={tagEditor.mode === 'create' ? 'Create tag' : 'Edit tag'}
                />
              </div>
            ) : null}

            {isTagsLoading ? <div className="project-state">Loading tags...</div> : null}

            {isTagsError ? (
              <div className="project-state project-state--error">
                Unable to load tags.
                <span>{tagsError instanceof Error ? tagsError.message : 'Unknown error'}</span>
              </div>
            ) : null}

            {!isTagsLoading && !isTagsError && tags.length === 0 ? (
              <div className="project-empty-state member-workspace__empty-state">
                <div>
                  <p className="project-empty-state__eyebrow">No tags yet</p>
                  <h3 className="project-empty-state__title">Create the first reusable tag</h3>
                  <p className="project-empty-state__description">
                    Tag records are stored locally and will later be reused by task and subtask workflows.
                  </p>
                </div>
              </div>
            ) : null}

            {!isTagsLoading && !isTagsError && visibleTags.length > 0 ? (
              <div className="project-list">
                {visibleTags.map((tag) => (
                  <article key={tag.id} className="project-list__item member-workspace__item">
                    <div className="project-list__meta">
                      <div className="member-workspace__item-title-row">
                        <TagBadge tag={tag} />
                        <span className="member-workspace__role">{tag.color || 'No color'}</span>
                      </div>

                      <dl className="project-list__details member-workspace__details">
                        <div>
                          <dt>Name</dt>
                          <dd>{tag.name}</dd>
                        </div>
                        <div>
                          <dt>Color</dt>
                          <dd>{formatDate(tag.color ?? null)}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="project-list__actions">
                      <button
                        className="project-list__button"
                        type="button"
                        onClick={() => openTagEdit(tag.id)}
                      >
                        Edit
                      </button>
                      <button
                        className="project-list__button project-list__button--danger"
                        type="button"
                        onClick={() => void handleTagDeleteRequest(tag)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {tagDeleteState !== null ? (
              <div className="project-detail__confirm project-detail__confirm--compact member-workspace__confirm">
                <strong>{tagDeleteState.usage.isUsed ? 'Delete used tag?' : 'Delete this tag?'}</strong>
                <p>
                  {tagDeleteState.usage.isUsed
                    ? `This tag is used in ${formatTagUsageSummary(tagDeleteState.usage)}. Repository cleanup will remove the tag from those records after confirmation.`
                    : 'This tag is not used anywhere and can be deleted directly.'}
                </p>
                <div className="project-detail__confirm-actions">
                  <button
                    className="project-list__button project-list__button--secondary"
                    type="button"
                    onClick={() => setTagDeleteState(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="project-list__button project-list__button--danger"
                    disabled={deleteTag.isPending}
                    type="button"
                    onClick={async () => {
                      await confirmTagDelete()
                    }}
                  >
                    {deleteTag.isPending ? 'Deleting...' : 'Confirm delete'}
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </section>
  )
}
