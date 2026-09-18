import { useState, type FormEvent } from 'react';
import type { Product, SizeSystem } from '../types';
import './admin.css';
import { uploadPhoto } from '../api/product';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  createProduct,
  deleteProduct,
  selectAllProducts,
  updateProduct,
} from '../store/slices/productsSlice';

type FormState = {
  id: string;
  code: string;
  name: string;
  modelType: string;
  season: string;
  wholesalePrice: number;
  minQuantity: number;
  piecesPerSeries: number;
  sizeSystem: SizeSystem;
  sizesText: string;
  colorsText: string;
  material: string;
  lining: string;
  featuresText: string;
  description: string;
  imageUrls: string[];
  isInStock: boolean;
};

const empty: FormState = {
  id: '',
  code: '',
  name: '',
  modelType: 'Куртка',
  season: 'Осень-Зима',
  wholesalePrice: 200,
  minQuantity: 50,
  piecesPerSeries: 4,
  sizeSystem: 'numeric',
  sizesText: '42,44,46,48',
  colorsText: 'L1:Чёрный:#1a1a1a, L3:Молочный:#f0ebe3',
  material: '',
  lining: '',
  featuresText: 'Двусторонняя, Мех внутри',
  description: '',
  imageUrls: [],
  isInStock: true,
};


function toForm(p: Product): FormState {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    modelType: p.modelType,
    season: p.season,
    wholesalePrice: p.wholesalePrice,
    minQuantity: p.minQuantity,
    piecesPerSeries: p.piecesPerSeries,
    sizeSystem: p.sizeSystem,
    sizesText: p.sizes.join(','),
    colorsText: p.colors.map((c) => `${c.code}:${c.name}:${c.hex}`).join(', '),
    material: p.material,
    lining: p.lining,
    featuresText: p.features.join(', '),
    description: p.description,
    imageUrls: p.imageUrls ?? [],
    isInStock: p.isInStock,
  };
}

export function AdminProductsPage() {
  const products = useAppSelector(selectAllProducts);
  const dispatch = useAppDispatch();
  const [form, setForm] = useState<FormState>(empty);
  const editing = Boolean(form.id);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (uploading) {
      return;
    }
    const colors = form.colorsText
      .split(',')
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const [code, name, hex] = chunk.split(':').map((s) => s.trim());
        return {
          code: code || 'X',
          name: name || code,
          hex: hex || '#888888',
          imageUrls: form.imageUrls,
        };
      });

    const product: Product = {
      id: form.id || crypto.randomUUID(),
      code: form.code,
      name: form.name,
      modelType: form.modelType,
      season: form.season,
      wholesalePrice: Number(form.wholesalePrice),
      minQuantity: Number(form.minQuantity),
      piecesPerSeries: Number(form.piecesPerSeries),
      sizeSystem: form.sizeSystem,
      sizes: form.sizesText.split(',').map((s) => s.trim()).filter(Boolean),
      colors,
      material: form.material,
      lining: form.lining,
      features: form.featuresText.split(',').map((s) => s.trim()).filter(Boolean),
      description: form.description,
      imageUrls: form.imageUrls,
      isInStock: form.isInStock,
      createdAt: new Date().toISOString(),
    };

    if (editing) {
      await dispatch(updateProduct(product)).unwrap();
    } else {
      await dispatch(createProduct(product)).unwrap();
    }
    setForm(empty);
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
  
    setUploading(true);
    setUploadError(null);

    try {
      const list = Array.from(files);
      const urls = await Promise.all(list.map((file) => uploadPhoto(file)));
      console.log('UPLOADED URLS:', urls);

      setForm((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...urls],
      }));

    } catch (err) {
      console.error(err);
      setUploadError('Cannot upload the photo!');
    } finally {
      setUploading(false);
      e.target.value = ''
    }
  }

  function removePhoto(urlToRemove: string) {
    setForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((url) => url !== urlToRemove),
    }));
  }

  return (
    <div className="admin-split">
      <form className="card-surface admin-form" onSubmit={onSubmit}>
        <h3>{editing ? 'Редактировать модель' : 'Новая модель'}</h3>
        <div className="field">
          <label>Артикул</label>
          <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </div>
        <div className="field">
          <label>Название</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Тип</label>
          <select value={form.modelType} onChange={(e) => setForm({ ...form, modelType: e.target.value })}>
            <option>Куртка</option>
            <option>Ветровка</option>
            <option>Жилетка</option>
            <option>Балонка</option>
          </select>
        </div>
        <div className="field">
          <label>Сезон</label>
          <input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} />
        </div>
        <div className="field">
          <label>Оптовая цена (CNY / ¥)</label>
          <input
            type="number"
            required
            value={form.wholesalePrice}
            onChange={(e) => setForm({ ...form, wholesalePrice: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Мин. кол-во</label>
          <input
            type="number"
            required
            value={form.minQuantity}
            onChange={(e) => setForm({ ...form, minQuantity: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Шт. в серии</label>
          <input
            type="number"
            required
            value={form.piecesPerSeries}
            onChange={(e) => setForm({ ...form, piecesPerSeries: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Система размеров</label>
          <select
            value={form.sizeSystem}
            onChange={(e) => setForm({ ...form, sizeSystem: e.target.value as SizeSystem })}
          >
            <option value="numeric">Номера (42–62)</option>
            <option value="letter">Буквы (XS–XL)</option>
          </select>
        </div>
        <div className="field">
          <label>Размеры (через запятую)</label>
          <input value={form.sizesText} onChange={(e) => setForm({ ...form, sizesText: e.target.value })} />
        </div>
        <div className="field">
          <label>Цвета код:имя:hex</label>
          <textarea
            rows={2}
            value={form.colorsText}
            onChange={(e) => setForm({ ...form, colorsText: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Материал</label>
          <input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
        </div>
        <div className="field">
          <label>Подкладка / мех</label>
          <input value={form.lining} onChange={(e) => setForm({ ...form, lining: e.target.value })} />
        </div>
        <div className="field">
          <label>Особенности</label>
          <input
            value={form.featuresText}
            onChange={(e) => setForm({ ...form, featuresText: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Описание</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Фото модели</label>
          <input type="file" accept="image/*" multiple onChange={onFileChange} />
          {uploading && <span>Загрузка…</span>}
          {uploadError && <div className="alert">{uploadError}</div>}
          <p className="muted">Загружено фото: {form.imageUrls.length}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {form.imageUrls.map((url) => (
              <div key={url} style={{ position: 'relative' }}>
                <img
                  src={encodeURI(url)}
                  alt=""
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: 'cover',
                    border: '1px solid #ccc',
                  }}
                />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    border: 'none',
                    borderRadius: 999,
                    width: 24,
                    height: 24,
                    cursor: 'pointer',
                    background: '#111',
                    color: '#fff',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <label className="check">
          <input
            type="checkbox"
            disabled={uploading}
            checked={form.isInStock}
            onChange={(e) => setForm({ ...form, isInStock: e.target.checked })}
          />
          В наличии
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-primary" type="submit" disabled={uploading}>
            {editing ? 'Сохранить' : 'Добавить'}
          </button>
          {editing && (
            <button type="button" className="btn btn-ghost" onClick={() => setForm(empty)}>
              Сброс
            </button>
          )}
        </div>
      </form>

      <div className="card-surface" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Артикул</th>
              <th>Модель</th>
              <th>Серия</th>
              <th>Цена</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.code}</td>
                <td>{p.name}</td>
                <td>
                  {p.piecesPerSeries} шт · мин {p.minQuantity}
                </td>
                <td>{p.wholesalePrice}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setForm(toForm(p))}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => void dispatch(deleteProduct(p.id))}
                  >
                    Del
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
