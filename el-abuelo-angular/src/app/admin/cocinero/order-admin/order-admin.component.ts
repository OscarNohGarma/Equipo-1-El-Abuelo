import { Component, OnInit } from '@angular/core';
import { OrderMenu } from '../../../core/models/orderMenu';
import { OrderMenuService } from '../../../core/services/order-menu.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
declare var Swal: any;
@Component({
  selector: 'app-order-admin',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './order-admin.component.html',
  styleUrl: './order-admin.component.scss',
  providers: [OrderMenuService],
})
export class OrderAdminComponent implements OnInit {
  selectedStatus: string = 'queue'; // Estado por defecto (gris)
  orderItems: OrderMenu[] = [];
  isDetailsOpen: boolean = false; // Para controlar la visibilidad del menú desplegable
  currentStatus: string = 'queue'; // Para controlar la visibilidad del menú desplegable
  statusFilter: string = ''; // Filtro de stock (activo/inactivo)
  copmpleteFilter: string = 'active'; // Filtro de stock (activo/inactivo)
  disableStatusFilter: boolean = false; // Nueva propiedad para desactivar el select
  constructor(
    private orderMenuService: OrderMenuService,
    private notificationService: NotificationService
  ) {} // Inyectar el servicio
  ngOnInit(): void {
    this.loadOrders();
  }
  loadOrders(): void {
    this.orderMenuService.getAll().subscribe((data) => {
      // Añadir la propiedad `isDetailsOpen` a cada orden
      this.orderItems = data
        .filter(
          (order) => order.status !== 'completed' && order.status !== 'paid'
        )
        .map((order) => ({
          ...order,
          isDetailsOpen: false, // Inicia en false para que los detalles estén ocultos al principio
        }));
    });
    this.notificationService.listenToEvent('orderAdded', (data) => {
      console.log('Evento recibido desde el servidor:', data);
      // Aquí puedes mostrar una notificación o hacer lo que necesites
      this.showNotification(data.message, data.user);
    });
  }

  private showNotification(message: string, user: string): void {
    this.showInfoPopup(
      'info',
      'Nueva orden',
      'Se ha añadido una nueva orden del usuario: ' + user
    );
    this.loadOrders();
  }

  get filteredOrders(): OrderMenu[] {
    return this.orderItems.filter((order) => {
      const matchesStatus =
        this.statusFilter === '' || order.status === this.statusFilter;
      const matchesComplete =
        this.copmpleteFilter === '' ||
        (this.copmpleteFilter === 'completed' &&
          order.status === 'completed') ||
        (this.copmpleteFilter === 'active' && order.status !== 'completed');

      return matchesStatus && matchesComplete;
    });
  }

  completar(order: OrderMenu): void {
    this.showConfirmPopup(
      '¿Deseas enviar esta orden?',
      'Esta orden desaparecerá de esta sección y pasará al repartidor/cajero.'
    ).then((result: any) => {
      if (result.isConfirmed) {
        // El usuario confirmó la acción
        const newOrder = {
          ...order,
          status: 'completed',
        };
        this.orderMenuService.update(order.id.toString(), newOrder).subscribe(
          (response) => {
            // El producto fue eliminado exitosamente
            setTimeout(() => {
              const tipoEntrega = order.tipoEntrega;
              const user = order.user;
              this.notificationService.emitEvent('completeOrder', {
                tipoEntrega,
                user,
              });
              this.showPopup(
                'success',
                '¡Orden enviada!',
                'La orden se envió correctamente. Ahora el repartidor/cajero podrá verla en su lista.'
              ).then((result: any) => {
                this.loadOrders(); // Recargar el menú después de eliminar el producto
              });
            }, 100);
          },
          (error) => {
            // Ocurrió un error al eliminar el producto
            this.showPopup(
              'error',
              'Ocurrió un problema.',
              'Error al enviar la orden.'
            );
          }
        );
      }
    });
  }
  toggleDetails(order: OrderMenu): void {
    order.isDetailsOpen = !order.isDetailsOpen; // Alternar el estado de visibilidad de los detalles para esa orden
  }
  setStatus(status: string, order: OrderMenu) {
    this.selectedStatus = status;
    order.status = status;
    const newOrder = {
      ...order,
      status: this.selectedStatus,
    };
    this.orderMenuService.update(order.id.toString(), newOrder).subscribe(
      (response) => {
        //! console.log('Producto actualizado exitosamente:', response);
        // Aquí puedes redirigir o mostrar un mensaje de éxito
      },
      (error) => {
        console.error('Error al actualizar la orden:', error);
        // Manejo de errores aquí
      }
    );
  }
  updateStatus(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.statusFilter = selectElement.value;
  }

  // Método para actualizar el filtro de stock
  updateComplete(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.copmpleteFilter = selectElement.value;
    if (this.copmpleteFilter === 'completed') {
      this.statusFilter = ''; // Mostrará todas las órdenes completadas, sin importar el estado
      this.disableStatusFilter = true; // Desactiva el select del filtro de estado
    } else {
      this.disableStatusFilter = false; // Activa el filtro de estado si no están completadas
    }
  }

  deleteOrder(id: number, user: string) {
    this.showConfirmDeletePopup(
      '¿Estás seguro que deseas cancelar la orden?',
      'Esta orden desaparecerá de esta sección'
    ).then((result: any) => {
      if (result.isConfirmed) {
        this.orderMenuService.delete(id.toString()).subscribe(
          (response) => {
            // console.log('Producto eliminado:', response);
            // Aquí puedes agregar lógica para actualizar la vista
            setTimeout(() => {
              this.notificationService.emitEvent('cancelOrder', { id, user });
              this.showPopup(
                'success',
                'Orden cancelada',
                'Orden cancelada correctamente'
              ).then((result: any) => {
                this.loadOrders(); // Recargar el menú después de eliminar el producto
              });
            }, 500);
          },
          (error) => {
            this.showPopup(
              'error',
              'Ocurrió un error',
              'No se pudo cancelar la orden'
            );
          }
        );
      }
    });
  }
  //POPUP
  showPopup(icon: 'success' | 'error' | 'info', title: string, text: string) {
    return Swal.fire({
      icon,
      title,
      text,
      confirmButtonText: icon === 'success' ? 'Aceptar' : 'Entendido',
      didOpen: () => {
        const confirmButton = Swal.getConfirmButton();
        if (confirmButton) {
          confirmButton.style.backgroundColor = '#343a40';
          confirmButton.onmouseover = () => {
            confirmButton.style.backgroundColor = '#212529'; // Color en hover
          };
          confirmButton.onmouseout = () => {
            confirmButton.style.backgroundColor = '#343a40'; // Color normal
          };
        }
      },
    });
  }
  //CONFIRM POPUP
  showConfirmPopup(title: string, text: string) {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
      buttonsStyling: false, // Desactivar estilos predeterminados de SweetAlert2
      didOpen: () => {
        // Aplicar estilos directamente
        const confirmButton = Swal.getConfirmButton();
        const cancelButton = Swal.getCancelButton();

        if (confirmButton) {
          confirmButton.style.backgroundColor = '#343a40';
          confirmButton.style.color = '#fff';
          confirmButton.style.padding = '10px 20px';
          confirmButton.style.fontWeight = 'bold';
          confirmButton.style.border = 'none';
          confirmButton.style.border = '2px solid #343a40';
          confirmButton.style.borderRadius = '5px';
          confirmButton.style.transition = 'background-color 0.3s ease'; // Agregar transición
          confirmButton.style.marginRight = '10px'; // Agregar transición

          confirmButton.onmouseover = () => {
            confirmButton.style.backgroundColor = '#24272b'; // Color en hover
          };
          confirmButton.onmouseout = () => {
            confirmButton.style.backgroundColor = '#343a40'; // Color normal
          };
        }

        if (cancelButton) {
          cancelButton.style.backgroundColor = '#fff';
          cancelButton.style.color = '#dc3545';
          cancelButton.style.padding = '10px 20px';
          cancelButton.style.fontWeight = 'bold';
          cancelButton.style.border = 'none';
          cancelButton.style.border = '2px solid #dc3545';
          cancelButton.style.borderRadius = '5px';
          cancelButton.style.transition = 'background-color 0.3s ease'; // Agregar transición

          cancelButton.onmouseover = () => {
            cancelButton.style.color = '#fff';
            cancelButton.style.backgroundColor = '#dc3545'; // Color en hover
          };
          cancelButton.onmouseout = () => {
            cancelButton.style.backgroundColor = '#fff'; // Color normal
            cancelButton.style.color = '#dc3545';
          };
        }
      },
    });
  }
  showConfirmDeletePopup(title: string, text: string) {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Salir',
      buttonsStyling: false, // Desactivar estilos predeterminados de SweetAlert2
      didOpen: () => {
        // Aplicar estilos directamente
        const confirmButton = Swal.getConfirmButton();
        const cancelButton = Swal.getCancelButton();

        if (confirmButton) {
          confirmButton.style.backgroundColor = '#fff';
          confirmButton.style.color = '#dc3545';
          confirmButton.style.padding = '10px 20px';
          confirmButton.style.fontWeight = 'bold';
          confirmButton.style.border = 'none';
          confirmButton.style.border = '2px solid #dc3545';
          confirmButton.style.borderRadius = '5px';
          confirmButton.style.transition = 'background-color 0.3s ease'; // Agregar transición
          confirmButton.style.marginRight = '10px'; // Agregar transición

          confirmButton.onmouseover = () => {
            confirmButton.style.backgroundColor = '#dc3545'; // Color en hover
            confirmButton.style.color = '#fff';
          };
          confirmButton.onmouseout = () => {
            confirmButton.style.backgroundColor = '#fff'; // Color normal
            confirmButton.style.color = '#dc3545';
          };
        }

        if (cancelButton) {
          cancelButton.style.backgroundColor = '#343a40';
          cancelButton.style.color = '#fff';
          cancelButton.style.padding = '10px 20px';
          cancelButton.style.fontWeight = 'bold';
          cancelButton.style.border = 'none';
          cancelButton.style.border = '2px solid #343a40';
          cancelButton.style.borderRadius = '5px';
          cancelButton.style.transition = 'background-color 0.3s ease'; // Agregar transición

          cancelButton.onmouseover = () => {
            cancelButton.style.backgroundColor = '#24272b'; // Color en hover
          };
          cancelButton.onmouseout = () => {
            cancelButton.style.backgroundColor = '#343a40'; // Color normal
          };
        }
      },
    });
  }
  showInfoPopup(
    icon: 'success' | 'error' | 'info',
    title: string,
    text: string
  ) {
    return Swal.fire({
      icon,
      title,
      text,
      confirmButtonText: icon === 'success' ? 'Aceptar' : 'Entendido',
      didOpen: () => {
        const confirmButton = Swal.getConfirmButton();
        if (confirmButton) {
          confirmButton.style.backgroundColor = '#343a40';
          confirmButton.onmouseover = () => {
            confirmButton.style.backgroundColor = '#212529'; // Color en hover
          };
          confirmButton.onmouseout = () => {
            confirmButton.style.backgroundColor = '#343a40'; // Color normal
          };
        }
      },
    });
  }
}
