import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MenuService } from '../../core/services/menu.service';
import { MenuProduct } from '../../core/models/menuProduct';
import { Router, RouterModule } from '@angular/router';
import { UploadService } from '../../core/services/upload.service';
import { response } from 'express';

@Component({
  selector: 'app-menu-admin',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './menu-admin.component.html',
  styleUrl: './menu-admin.component.scss',
  providers: [MenuService, UploadService],
})
export class MenuAdminComponent implements OnInit {
  selectedCategory: string = 'TODOS'; // Categoría por defecto
  isMenuOpen: boolean = false; // Para controlar la visibilidad del menú desplegable
  showOrder: boolean = false; // Controla la visibilidad de la orden
  menuItems: MenuProduct[] = [];
  expandedImage: string | null = null; // Controla la imagen expandida

  constructor(
    private uploadService: UploadService,
    private menuService: MenuService,
    private router: Router
  ) {} // Inyectar el servicio

  ngOnInit(): void {
    // this.http.get('http://localhost:3000/firebase/menu/getmenu').subscribe(
    //   (data) => {
    //     console.log(data);
    //   },
    //   (error) => {
    //     console.error(error);
    //   }
    // );
    this.loadMenu();
  }
  loadMenu(): void {
    this.menuService.getMenu().subscribe((data) => {
      this.menuItems = data;
      // console.log(this.menuItems);
    });
  }

  get filteredProducts(): MenuProduct[] {
    if (this.selectedCategory === 'TODOS') {
      return this.menuItems;
    }
    return this.menuItems.filter(
      (product) => product.categoria === this.selectedCategory
    );
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  selectCategory(category: string) {
    this.selectedCategory = category;
    this.isMenuOpen = false; // Cierra el menú después de seleccionar una opción
  }

  // Función para abrir la imagen
  openImage(imageUrl: string) {
    this.expandedImage = imageUrl;
  }

  // Función para cerrar la imagen
  closeImage() {
    this.expandedImage = null;
  }
  deleteProducto(id: number, image: string) {
    console.log(this.getFileNameFromUrl(image));

    const confirmed = window.confirm(
      '¿Estás seguro de que deseas eliminar este ítem del menú?'
    );
    if (confirmed) {
      this.uploadService.deleteImage(this.getFileNameFromUrl(image)!).subscribe(
        (response) => {
          console.log('Imagen eliminada.');
        },
        (error) => {
          console.error('Error al eliminar imagen:', error);
        }
      );
      this.menuService.deleteMenuItem(id.toString()).subscribe(
        (response) => {
          // console.log('Producto eliminado:', response);
          // Aquí puedes agregar lógica para actualizar la vista
          setTimeout(() => {
            alert('Producto eliminado correctamente.');
            this.loadMenu(); // Por ejemplo, recargar el menú
          }, 500);
        },
        (error) => {
          console.error('Error al eliminar el producto:', error);
        }
      );
    }
  }
  getFileNameFromUrl(url: string): string | null {
    // Usar una expresión regular para extraer el nombre del archivo completo (ID + extensión)
    const match = url.match(/\/([^\/]+\.[a-zA-Z]+)$/);

    // Retornar el nombre del archivo si se encuentra, de lo contrario retornar null
    return match ? match[1] : null;
  }
}
