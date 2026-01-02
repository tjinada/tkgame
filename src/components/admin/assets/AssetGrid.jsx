import { AssetSlot } from './AssetSlot'

export function AssetGrid({ 
  items = [], 
  columns = 4,
  onUpload,
  onDelete,
}) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5',
    6: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6',
  }

  return (
    <div className={`grid ${gridCols[columns] || gridCols[4]} gap-4`}>
      {items.map((item) => (
        <AssetSlot
          key={item.id}
          label={item.label}
          asset={item.url}
          onUpload={(file) => onUpload(item.id, file)}
          onDelete={() => onDelete(item.id)}
          placeholder={item.placeholder}
        />
      ))}
    </div>
  )
}

export default AssetGrid
