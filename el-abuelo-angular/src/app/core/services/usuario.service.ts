import { Injectable } from '@angular/core';
import { GenericService } from '../../shared/generic.service';
import { Usuario } from '../models/usuario';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService extends GenericService<Usuario> {
  constructor(http: HttpClient) {
    super(http);
  }
  protected override getBaseUrl(): string {
    return `${environment.apiUrl}/usuario`;
  }
}