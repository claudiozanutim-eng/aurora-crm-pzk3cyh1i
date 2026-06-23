import React, { useState, KeyboardEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

const DEFAULT_TAGS = ['Frio', 'Quente', 'Parceria']

export function TagInput({
  value = [],
  onChange,
}: {
  value?: string[]
  onChange: (tags: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleUnselect = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleSelect = (tag: string) => {
    if (!value.includes(tag)) {
      onChange([...value, tag])
    }
    setInputValue('')
    setOpen(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault()
      handleSelect(inputValue)
    }
  }

  const availableTags = DEFAULT_TAGS.filter((t) => !value.includes(t))
  const showCreate = inputValue && !DEFAULT_TAGS.includes(inputValue) && !value.includes(inputValue)

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1.5 text-xs py-1">
          {tag}
          <button
            type="button"
            className="ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => handleUnselect(tag)}
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center border rounded-md px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-dashed bg-transparent text-muted-foreground hover:bg-secondary/80 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Adicionar tag
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command onKeyDown={handleKeyDown}>
            <CommandInput
              placeholder="Buscar ou criar tag..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>
                {inputValue ? (
                  <button
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                    onClick={() => handleSelect(inputValue)}
                  >
                    Criar tag "{inputValue}"
                  </button>
                ) : (
                  'Nenhuma tag encontrada.'
                )}
              </CommandEmpty>
              <CommandGroup>
                {availableTags.map((tag) => (
                  <CommandItem key={tag} onSelect={() => handleSelect(tag)}>
                    {tag}
                  </CommandItem>
                ))}
                {showCreate && (
                  <CommandItem onSelect={() => handleSelect(inputValue)}>
                    Criar tag "{inputValue}"
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
