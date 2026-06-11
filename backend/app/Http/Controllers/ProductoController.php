<?php
// app/Http/Controllers/ProductoController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Producto;
use App\Models\Categoria;
use App\Helpers\ApiResponse;
use App\Http\Requests\ProductoRequest;
use Illuminate\Support\Facades\Log;

class ProductoController extends Controller
{
    /**
     * Listar productos (usa la vista con filtrado automático por rol)
     */
    public function index(Request $request)
    {
        try {
            // Usar la vista que aplica RLS automáticamente
            $query = DB::table('vista_productos');

            // Filtros opcionales
            if ($request->has('categoria_id')) {
                $query->where('categoria_id', $request->categoria_id);
            }

            if ($request->has('search')) {
                $query->where('nombre', 'LIKE', '%' . $request->search . '%');
            }

            if ($request->has('sucursal_id')) {
                $query->where('sucursal_id', $request->sucursal_id);
            }

            if ($request->has('activo')) {
                $query->where('activo', $request->activo);
            }

            $productos = $query->orderBy('id', 'desc')->paginate(20);

            return ApiResponse::success($productos, 'Productos obtenidos exitosamente');

        } catch (\Exception $e) {
            return ApiResponse::error('Error al listar productos: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener un producto específico
     */
    public function show($id)
    {
        try {
            // Log::info(DB::select('select @app_user_role'));

            $producto = DB::table('vista_productos')
                ->where('id', $id)
                ->first();

            if (!$producto) {
                return ApiResponse::notFound('Producto no encontrado o no tienes permisos para verlo');
            }

            return ApiResponse::success($producto, 'Producto obtenido exitosamente');

        } catch (\Exception $e) {
            return ApiResponse::error('Error al obtener producto: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Crear producto (solo vendedores y admin)
     */
    public function store(ProductoRequest $request)
    {
        try {
            // Usar procedimiento almacenado que valida permisos
            $result = DB::select(
                'CALL sp_insertar_producto(?, ?, ?, ?, ?)',
                [
                    $request->nombre,
                    $request->descripcion,
                    $request->precio,
                    $request->stock,
                    $request->categoria_id
                ]
            );

            Log::info($request);

            $productoId = $result[0]->producto_id ?? null;

            // Obtener el producto creado
            $producto = DB::table('vista_productos')->where('id', $productoId)->first();

            return ApiResponse::success([
                'producto' => $producto,
                'producto_id' => $productoId
                ], 'Producto creado exitosamente', 201);

        } catch (\Exception $e) {
            Log::info($request);
            return ApiResponse::error('Error al crear producto: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Actualizar producto
     */
    public function update(ProductoRequest $request, $id)
    {
        try {
            DB::statement(
                'CALL sp_actualizar_producto(?, ?, ?, ?, ?, ?, ?)',
                [
                    $id,
                    $request->nombre,
                    $request->descripcion,
                    $request->precio,
                    $request->stock,
                    $request->categoria_id,
                    $request->activo ?? true
                ]
            );

            // Obtener el producto actualizado
            $producto = DB::table('vista_productos')->where('id', $id)->first();

            return ApiResponse::success($producto, 'Producto actualizado exitosamente');

        } catch (\Exception $e) {
            return ApiResponse::error('Error al actualizar producto: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Eliminar producto (soft delete)
     */
    public function destroy($id)
    {
        try {
            DB::statement('CALL sp_eliminar_producto(?)', [$id]);
            return ApiResponse::success(null, 'Producto eliminado exitosamente');

        } catch (\Exception $e) {
            return ApiResponse::error('Error al eliminar producto: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Listar categorías
     */
    public function categorias()
    {
        try {
            $categorias = Categoria::all();

            return ApiResponse::success($categorias, 'Categorías obtenidas exitosamente');

        } catch (\Exception $e) {
            return ApiResponse::error('Error al listar categorías: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener productos por vendedor
     */
    public function porVendedor($vendedorId)
    {
        try {
            $productos = DB::table('vista_productos')
                ->where('vendedor_id', $vendedorId)
                ->orderBy('id', 'desc')
                ->paginate(20);
            // Log::info();
            return ApiResponse::success($productos, 'Productos del vendedor obtenidos exitosamente');

        } catch (\Exception $e) {
            return ApiResponse::error('Error al obtener productos: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener productos por sucursal
     */
    public function porSucursal($sucursalId)
    {
        try {
            $productos = DB::table('vista_productos')
                ->where('sucursal_id', $sucursalId)
                ->orderBy('id', 'desc')
                ->paginate(20);

            return ApiResponse::success($productos, 'Productos de la sucursal obtenidos exitosamente');

        } catch (\Exception $e) {
            return ApiResponse::error('Error al obtener productos: ' . $e->getMessage(), 500);
        }
    }
}
