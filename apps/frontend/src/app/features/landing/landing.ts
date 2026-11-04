import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Reveal } from '../../shared/directives/reveal';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, TranslatePipe, Reveal],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingPage {
  protected readonly steps = [1, 2, 3, 4].map((n) => ({
    n,
    title: `landing.how.step${n}Title`,
    text: `landing.how.step${n}Text`,
  }));
  protected readonly parentItems = [
    { icon: '📊', n: 1 },
    { icon: '🎀', n: 2 },
    { icon: '💌', n: 3 },
    { icon: '🔒', n: 4 },
  ];
  protected readonly guestItems = [
    { icon: '🔗', n: 1 },
    { icon: '🧸', n: 2 },
    { icon: '💬', n: 3 },
    { icon: '📱', n: 4 },
  ];
}
