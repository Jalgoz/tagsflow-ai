import { useState } from 'react'
import type { ChecklistFormItemValues } from '../../application'

type ChecklistEditorProps = {
  items: ChecklistFormItemValues[]
  onChange: (items: ChecklistFormItemValues[]) => void
}

export const ChecklistEditor = ({ items, onChange }: ChecklistEditorProps) => {
  const [draftText, setDraftText] = useState('')

  const addItem = () => {
    const text = draftText.trim()

    if (text.length === 0) {
      return
    }

    onChange([...items, { completed: false, text }])
    setDraftText('')
  }

  const updateItemText = (index: number, text: string) => {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, text } : item)))
  }

  const toggleItem = (index: number) => {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, completed: !item.completed } : item)))
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_item, itemIndex) => itemIndex !== index))
  }

  return (
    <div className="checklist-editor">
      <div className="checklist-editor__add-row">
        <input
          aria-label="New checklist item"
          className="project-form__input"
          placeholder="Add checklist item"
          type="text"
          value={draftText}
          onChange={(event) => setDraftText(event.target.value)}
        />
        <button className="project-list__button" type="button" onClick={addItem}>
          Add
        </button>
      </div>

      {items.length > 0 ? (
        <div className="checklist-editor__items">
          {items.map((item, index) => (
            <div key={`${item.text}-${index}`} className="checklist-editor__item">
              <input
                aria-label={`Complete ${item.text || `checklist item ${index + 1}`}`}
                checked={item.completed}
                type="checkbox"
                onChange={() => toggleItem(index)}
              />
              <input
                aria-label={`Checklist item ${index + 1}`}
                className="project-form__input"
                type="text"
                value={item.text}
                onChange={(event) => updateItemText(index, event.target.value)}
              />
              <button className="project-list__button project-list__button--secondary" type="button" onClick={() => removeItem(index)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="checklist-editor__empty">No checklist items.</p>
      )}
    </div>
  )
}
