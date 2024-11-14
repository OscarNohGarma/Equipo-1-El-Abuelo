import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunityService } from '../../../../core/services/comentario.service';
import { Community } from '../../../../core/models/comentario';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SpinnerComponent } from '../../../../shared/spinner/spinner.component';
import Swal from 'sweetalert2';
//import { AdminAuthService } from '../../../../core/services/admin-auth.service';  // Importamos el servicio de autenticación
import { AdminAuthService
  
 } from '../../../../auth/admin-auth.service';
@Component({
  selector: 'app-add-reply',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, SpinnerComponent],
  templateUrl: './add-reply.component.html',
  styleUrls: ['./add-reply.component.scss'],
  providers: [CommunityService],
})
export class AddReplyComponent {
  @Input() parentId!: number;
  @Output() replySubmitted = new EventEmitter<void>();
  
  loading: boolean = false;
  @Input() description: string = '';
  adminName: string = '';  // Variable para almacenar el nombre del admin

  constructor(
    private communityService: CommunityService,
    private adminAuthService: AdminAuthService // Inyectamos el servicio de autenticación
  ) {
    // Obtenemos el nombre del administrador desde el servicio
    this.adminName = this.adminAuthService.getUsername() || 'Admin';  // Si no hay nombre, usamos 'Admin' por defecto
  }

  submitReply(): void {
    if (this.description.trim()) {
      const now = new Date();
      const date = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${now.getFullYear()}`;
      const time = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      const respuestaComentario = new Community(
        0,
        this.adminName, // Usamos el nombre del administrador obtenido del servicio
        this.description,
        'Calificación',
        date,
        time,
        'admin',
        this.parentId
      );

      this.loading = true;
      this.communityService.add(respuestaComentario).subscribe({
        next: () => {
          Swal.fire('¡Respuesta enviada!', 'Has respondido al comentario.', 'success');
          this.description = '';
          this.loading = false;
          this.replySubmitted.emit();
        },
        error: () => {
          Swal.fire('Error', 'Hubo un problema al responder el comentario.', 'error');
          this.loading = false;
        },
      });
    } else {
      Swal.fire('Error', 'La respuesta no puede estar vacía.', 'error');
    }
  }
}